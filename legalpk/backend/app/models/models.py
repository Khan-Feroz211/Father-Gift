import enum
import uuid
from datetime import date, datetime, time
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    String,
    Text,
    Time,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, UUIDMixin


class CaseType(str, enum.Enum):
    criminal = "criminal"
    civil = "civil"
    family = "family"
    constitutional = "constitutional"
    commercial = "commercial"
    writ = "writ"
    revenue = "revenue"
    labour = "labour"
    other = "other"


class CaseStatus(str, enum.Enum):
    active = "active"
    pending = "pending"
    disposed = "disposed"
    adjourned = "adjourned"
    stayed = "stayed"
    appealed = "appealed"


class HearingPurpose(str, enum.Enum):
    arguments = "arguments"
    evidence = "evidence"
    framing_charges = "framing_charges"
    bail = "bail"
    judgment = "judgment"
    written_statement = "written_statement"
    mediation = "mediation"
    other = "other"


class DocumentType(str, enum.Enum):
    vakalatnama = "vakalatnama"
    bail_application = "bail_application"
    written_statement = "written_statement"
    constitutional_petition = "constitutional_petition"
    civil_plaint = "civil_plaint"
    injunction = "injunction"
    appeal = "appeal"
    revision = "revision"
    general_application = "general_application"


class User(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    bar_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    court_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    cases: Mapped[List["Case"]] = relationship("Case", back_populates="user", lazy="select")
    clients: Mapped[List["Client"]] = relationship("Client", back_populates="user", lazy="select")
    documents: Mapped[List["Document"]] = relationship("Document", back_populates="user", lazy="select")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user", lazy="select")


class Client(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "clients"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    cnic: Mapped[Optional[str]] = mapped_column(String(13), nullable=True, index=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    address: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_organization: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    ntn: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="clients")
    cases: Mapped[List["Case"]] = relationship("Case", back_populates="client", lazy="select")


class Case(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "cases"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("clients.id", ondelete="SET NULL"), nullable=True
    )
    case_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    case_type: Mapped[CaseType] = mapped_column(
        Enum(CaseType, name="case_type_enum"), nullable=False, default=CaseType.other
    )
    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus, name="case_status_enum"), nullable=False, default=CaseStatus.active
    )
    court_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    court_district: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    judge_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    opponent_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    opponent_advocate: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    fir_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    ps_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    filing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_hearing_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True, index=True)
    facts: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    legal_issues: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tags: Mapped[Optional[list]] = mapped_column(JSON, nullable=True, default=list)

    user: Mapped["User"] = relationship("User", back_populates="cases")
    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="cases")
    hearings: Mapped[List["Hearing"]] = relationship(
        "Hearing", back_populates="case", cascade="all, delete-orphan", lazy="select"
    )
    documents: Mapped[List["Document"]] = relationship(
        "Document", back_populates="case", cascade="all, delete-orphan", lazy="select"
    )


class Hearing(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "hearings"

    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    hearing_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    hearing_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    courtroom: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    purpose: Mapped[HearingPurpose] = mapped_column(
        Enum(HearingPurpose, name="hearing_purpose_enum"),
        nullable=False,
        default=HearingPurpose.other,
    )
    outcome: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    next_date_set: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reminder_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    case: Mapped["Case"] = relationship("Case", back_populates="hearings")


class Document(UUIDMixin, TimestampMixin, Base):
    __tablename__ = "documents"

    case_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, name="document_type_enum"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    generated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )

    case: Mapped["Case"] = relationship("Case", back_populates="documents")
    user: Mapped["User"] = relationship("User", back_populates="documents")


class AuditLog(UUIDMixin, Base):
    __tablename__ = "audit_logs"

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(50), nullable=False)
    resource_id: Mapped[Optional[str]] = mapped_column(String(36), nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
