from typing import List, Optional
from pydantic import BaseModel, EmailStr


class ClientCreate(BaseModel):
    full_name: str
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_organization: bool = False
    ntn: Optional[str] = None


class ClientUpdate(BaseModel):
    full_name: Optional[str] = None
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_organization: Optional[bool] = None
    ntn: Optional[str] = None


class ClientResponse(BaseModel):
    id: str
    user_id: str
    full_name: str
    cnic: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    is_organization: bool
    ntn: Optional[str] = None
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, obj) -> "ClientResponse":
        return cls(
            id=str(obj.id),
            user_id=str(obj.user_id),
            full_name=obj.full_name,
            cnic=obj.cnic,
            phone=obj.phone,
            email=obj.email,
            address=obj.address,
            notes=obj.notes,
            is_organization=obj.is_organization,
            ntn=obj.ntn,
            created_at=obj.created_at.isoformat(),
            updated_at=obj.updated_at.isoformat(),
        )


class ClientListResponse(BaseModel):
    items: List[ClientResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
