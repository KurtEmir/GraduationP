from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.message import Message, MessageCreate, MessageList
from app.api.deps import get_db, get_current_user
from app.crud.crud_messages import messages as crud_messages
from app.schemas.user import User

router = APIRouter()

@router.post("/send", response_model=Message, status_code=status.HTTP_201_CREATED)
def send_message(
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_message = crud_messages.send(db, sender_id=current_user.id, obj_in=message_in)
    return db_message

@router.get("/conversation/{user_id}", response_model=List[Message])
def get_conversation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = crud_messages.get_conversation(db, user1_id=current_user.id, user2_id=user_id)
    return conversation 