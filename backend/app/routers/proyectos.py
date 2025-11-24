from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.cruds.crud_proyectos import CRUDProyecto
from app.database import get_db
from app.schemas import ProyectoCreate, ProyectoUpdate, ProyectoResponse

router = APIRouter()


@router.get("/clientes/{cliente_id}/proyectos", response_model=List[ProyectoResponse])
def listar_proyectos_por_cliente(
    cliente_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.listar_por_cliente(cliente_id)


@router.post("/proyectos", response_model=ProyectoResponse, status_code=status.HTTP_201_CREATED)
def crear_proyecto(
    proyecto_data: ProyectoCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.crear_proyecto(proyecto_data)


@router.get("/proyectos/{proyecto_id}", response_model=ProyectoResponse)
def obtener_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.obtener_por_id(proyecto_id)


@router.get("/proyectos", response_model=List[ProyectoResponse])
def listar_proyectos(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.listar_todos()


@router.put("/proyectos/{proyecto_id}", response_model=ProyectoResponse)
def actualizar_proyecto(
    proyecto_id: int,
    proyecto_data: ProyectoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.actualizar_proyecto(proyecto_id, proyecto_data)


@router.patch("/proyectos/{proyecto_id}/reasignar", response_model=ProyectoResponse)
def reasignar_proyecto(
    proyecto_id: int,
    reasignacion: ProyectoUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if reasignacion.cliente_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Se requiere el identificador del nuevo cliente",
        )

    crud_proyecto = CRUDProyecto(db)
    return crud_proyecto.reasignar_proyecto(proyecto_id, reasignacion.cliente_id)


@router.delete("/proyectos/{proyecto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_proyecto(
    proyecto_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    crud_proyecto = CRUDProyecto(db)
    crud_proyecto.eliminar_proyecto(proyecto_id)
