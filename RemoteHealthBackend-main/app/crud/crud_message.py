from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, desc, func
from typing import List, Optional, Tuple

from app.crud.base import CRUDBase
from app.models import User, Message # Assuming Message model is in app.models
from app.models.user_model import UserRole
from app.schemas.message import MessageCreate, Message as MessageSchema, ChatPartner as ChatPartnerSchema
from app.crud import crud_user # To get user details

class CRUDMessage(CRUDBase[Message, MessageCreate, MessageCreate]): # Using MessageCreate for Update for now
    def create_message(self, db: Session, *, obj_in: MessageCreate, sender_id: int) -> Message:
        db_obj = Message(
            sender_id=sender_id,
            receiver_id=obj_in.receiver_id,
            content=obj_in.content,
            is_read=False # Default to false
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_messages_by_conversation(
        self, db: Session, *, user_id: int, partner_id: int
    ) -> List[Message]:
        return (
            db.query(Message)
            .options(
                joinedload(Message.sender),
                joinedload(Message.receiver)
            )
            .filter(
                or_(
                    and_(Message.sender_id == user_id, Message.receiver_id == partner_id),
                    and_(Message.sender_id == partner_id, Message.receiver_id == user_id),
                )
            )
            .order_by(Message.timestamp.asc())
            .all()
        )

    def get_unread_count(self, db: Session, *, user_id: int, partner_id: int) -> int:
        return (
            db.query(Message)
            .filter(
                Message.receiver_id == user_id,
                Message.sender_id == partner_id,
                Message.is_read == False,
            )
            .count()
        )

    def get_last_message(self, db: Session, *, user_id: int, partner_id: int) -> Optional[Message]:
        return (
            db.query(Message)
            .filter(
                or_(
                    and_(Message.sender_id == user_id, Message.receiver_id == partner_id),
                    and_(Message.sender_id == partner_id, Message.receiver_id == user_id),
                )
            )
            .order_by(Message.timestamp.desc())
            .first()
        )

    def get_chat_partners(
        self, db: Session, *, current_user: User
    ) -> List[ChatPartnerSchema]:
        # The 'current_user' from the dependency is a Pydantic schema, not a SQLAlchemy model.
        # We need to fetch the SQLAlchemy model instance to access its relationships.
        user_db = db.query(User).filter(User.id == current_user.id).first()
        if not user_db:
            return []

        print(f"DEBUG: get_chat_partners called by current_user: ID={user_db.id}, Role={user_db.role}") # DEBUG
        partners = []
        potential_partners: List[User] = []

        if user_db.role == UserRole.PATIENT:
            # Patient sees their assigned doctor, if any
            if user_db.doctor:
                print(f"DEBUG: Current user is PATIENT with doctor_id {user_db.doctor_id}. Fetching their DOCTOR.") # DEBUG
                potential_partners.append(user_db.doctor)
            else:
                print(f"DEBUG: Current user is PATIENT but has no assigned doctor.") # DEBUG

        elif user_db.role == UserRole.DOCTOR:
            # Doctor sees all patients assigned to them
            print(f"DEBUG: Current user is DOCTOR. Fetching assigned PATIENTs.") # DEBUG
            potential_partners = user_db.patients
        
        print(f"DEBUG: Found {len(potential_partners)} potential_partners.") # DEBUG
        for partner_user_obj in potential_partners:
            if partner_user_obj.id == user_db.id:
                print(f"DEBUG: Skipping self (ID={user_db.id}).") # DEBUG
                continue

            last_msg_obj = self.get_last_message(db, user_id=user_db.id, partner_id=partner_user_obj.id)
            unread_count = self.get_unread_count(db, user_id=user_db.id, partner_id=partner_user_obj.id)
            
            partner_full_name = f"{partner_user_obj.first_name} {partner_user_obj.last_name}"
            
            chat_partner_data = ChatPartnerSchema(
                id=partner_user_obj.id,
                name=partner_full_name,
                role=partner_user_obj.role,
                last_message=last_msg_obj.content if last_msg_obj else None,
                last_message_timestamp=last_msg_obj.timestamp if last_msg_obj else None,
                unread_count=unread_count,
            )
            print(f"DEBUG: Appending ChatPartnerSchema: id={chat_partner_data.id}, name={chat_partner_data.name}") # DEBUG
            partners.append(chat_partner_data)
        
        print(f"DEBUG: Returning {len(partners)} final chat partners.") # DEBUG
        return partners

    def mark_as_read(self, db: Session, *, message_id: int, current_user_id: int) -> Optional[Message]:
        db_msg = db.query(Message).filter(Message.id == message_id).first()
        if db_msg and db_msg.receiver_id == current_user_id:
            db_msg.is_read = True
            db.commit()
            db.refresh(db_msg)
            return db_msg
        return None

message = CRUDMessage(Message) 