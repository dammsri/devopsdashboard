from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import Role, Functionality, User
from app.schemas.user import RoleOut, FunctionalityOut, RoleCreate, RoleUpdate, FunctionalityUpdate
from app.core.dependencies import get_current_user, require_permission

router = APIRouter(prefix="/security", tags=["Security Management"])

@router.get("/functionalities", response_model=List[FunctionalityOut])
def list_functionalities(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Functionality).all()

@router.put("/functionalities/{func_id}", response_model=FunctionalityOut)
def update_functionality(
    func_id: int,
    payload: FunctionalityUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("sys.security.manage"))
):
    func = db.query(Functionality).filter(Functionality.id == func_id).first()
    if not func:
        raise HTTPException(status_code=404, detail="Permission not found")
    func.description = payload.description
    db.commit()
    db.refresh(func)
    return func

@router.get("/roles", response_model=List[RoleOut])
def list_roles(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Role).all()

@router.post("/roles", response_model=RoleOut, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("sys.security.manage"))
):
    existing = db.query(Role).filter(Role.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role with this name already exists")
    
    role = Role(
        name=payload.name,
        description=payload.description,
        ad_group_mapping=payload.ad_group_mapping
    )
    if payload.functionality_ids:
        funcs = db.query(Functionality).filter(Functionality.id.in_(payload.functionality_ids)).all()
        role.functionalities = funcs
        
    db.add(role)
    db.commit()
    db.refresh(role)
    return role

@router.put("/roles/{role_id}", response_model=RoleOut)
def update_role(
    role_id: int, 
    payload: RoleUpdate,
    db: Session = Depends(get_db), 
    _: User = Depends(require_permission("sys.security.manage"))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if payload.name is not None:
        role.name = payload.name
    if payload.description is not None:
        role.description = payload.description
    if payload.ad_group_mapping is not None:
        role.ad_group_mapping = payload.ad_group_mapping
        
    if payload.functionality_ids is not None:
        funcs = db.query(Functionality).filter(Functionality.id.in_(payload.functionality_ids)).all()
        role.functionalities = funcs
        
    db.commit()
    db.refresh(role)
    return role

@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_permission("sys.security.manage"))
):
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    if role.name == "Super Admin":
        raise HTTPException(status_code=400, detail="Protected role 'Super Admin' cannot be deleted")
        
    db.delete(role)
    db.commit()
