from datetime import datetime
from typing import Annotated, Literal

from pydantic import EmailStr, StringConstraints
from sqlmodel import Field, SQLModel

Username = Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=50)]
FullName = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=100)]


class UserCreate(SQLModel):
    username: Username
    full_name: FullName
    email: EmailStr
    password: str = Field(min_length=8)


class UserPublic(SQLModel):
    id: int
    username: str
    full_name: str
    email: EmailStr
    role: Literal["user", "admin"]
    disabled: bool
    created_at: datetime
