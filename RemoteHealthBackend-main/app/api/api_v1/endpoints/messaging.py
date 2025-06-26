from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List

from app import crud, schemas, models
from app.api import deps
from app.models.user_model import UserRole # For role comparisons

router = APIRouter()

@router.get("/partners", response_model=List[schemas.message.ChatPartner])
def get_chat_partners(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get all chat partners for the current user.
    """
    # The CRUD method already handles role-based logic
    partners = crud.message.get_chat_partners(db, current_user=current_user)
    return partners

@router.get("/messages/{partner_id}", response_model=List[schemas.message.Message])
def get_conversation_messages(
    partner_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Get all messages between the current user and a partner.
    Messages are ordered from oldest to newest.
    """
    print(f"DEBUG: get_conversation_messages called for current_user ID={current_user.id} and partner_id={partner_id}") # DEBUG
    partner = crud.user.get(db, id=partner_id)
    if not partner:
        print(f"DEBUG: Partner with id={partner_id} NOT FOUND by crud.user.get. Raising 404.") # DEBUG
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Partner not found")
    
    print(f"DEBUG: Partner with id={partner_id} FOUND: Name={partner.first_name} {partner.last_name}, Role={partner.role}") # DEBUG

    messages = crud.message.get_messages_by_conversation(
        db, user_id=current_user.id, partner_id=partner_id
    )
    print(f"DEBUG: Found {len(messages)} messages in conversation between user {current_user.id} and partner {partner_id}.") # DEBUG
    
    # With eager loading in CRUD and properties in ORM model,
    # Pydantic schema should pick up sender_role and receiver_role automatically.
    return [schemas.message.Message.model_validate(msg_model) for msg_model in messages]

@router.post("/messages", response_model=schemas.message.Message, status_code=status.HTTP_201_CREATED)
def send_message(
    *, # Ensures other args are keyword-only
    db: Session = Depends(deps.get_db),
    message_in: schemas.message.MessageCreate,
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Send a new message.
    """
    receiver = crud.user.get(db, id=message_in.receiver_id)
    if not receiver:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Receiver not found or is not an active user."
        )

    # Example authorization: Allow if sender is superuser, or if sender is a doctor, or if receiver is a doctor.
    # Adjust this logic based on your actual requirements for who can message whom.
    if not (current_user.is_superuser or current_user.role == UserRole.DOCTOR or receiver.role == UserRole.DOCTOR):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to send a message to this user."
        )

    created_message_model = crud.message.create_message(
        db, obj_in=message_in, sender_id=current_user.id
    )
    
    # Populate sender_role and receiver_role for the response
    msg_response = schemas.message.Message.from_orm(created_message_model)
    msg_response.sender_role = current_user.role
    msg_response.receiver_role = receiver.role
    
    return msg_response

@router.put("/messages/{message_id}/read", status_code=status.HTTP_204_NO_CONTENT)
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_active_user),
):
    """
    Mark a specific message as read for the current user.
    """
    message_to_update = crud.message.get(db, id=message_id) # Assumes base CRUD has .get()
    if not message_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")

    if message_to_update.receiver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot mark message as read for another user",
        )

    if message_to_update.is_read:
        # No change needed, return 204
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    updated_message = crud.message.mark_as_read(
        db, message_id=message_id, current_user_id=current_user.id
    )
    if not updated_message:
        # This case should ideally be covered by checks above, but as a fallback
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found or not updatable")
    
    return Response(status_code=status.HTTP_204_NO_CONTENT) 