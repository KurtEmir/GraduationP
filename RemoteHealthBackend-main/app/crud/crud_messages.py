from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models import Message
from app.schemas.message import MessageCreate, MessageUpdate

class CRUDMessages(CRUDBase[Message, MessageCreate, MessageUpdate]):
    def send(self, db: Session, sender_id: int, obj_in: MessageCreate):
        db_obj = self.model(**obj_in.dict(), sender_id=sender_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_conversation(self, db: Session, user1_id: int, user2_id: int):
        return db.query(self.model).filter(
            ((Message.sender_id == user1_id) & (Message.receiver_id == user2_id)) |
            ((Message.sender_id == user2_id) & (Message.receiver_id == user1_id))
        ).order_by(Message.timestamp).all()

messages = CRUDMessages(Message) 