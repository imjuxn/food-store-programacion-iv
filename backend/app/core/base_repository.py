from typing import Generic, TypeVar

from sqlmodel import Session, SQLModel, select

ModelType = TypeVar("ModelType", bound=SQLModel)


class BaseRepository(Generic[ModelType]):
    def __init__(self, session: Session, model: type[ModelType]) -> None:
        self.session = session
        self.model = model

    def get_by_id(self, item_id: int) -> ModelType | None:
        return self.session.get(self.model, item_id)

    def get_all(self) -> list[ModelType]:
        return list(self.session.exec(select(self.model)).all())

    def add(self, item: ModelType) -> ModelType:
        self.session.add(item)
        return item

    def delete(self, item: ModelType) -> None:
        self.session.delete(item)
