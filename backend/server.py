from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Form, Query, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
import secrets
from enum import Enum
import httpx
from io import BytesIO
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'senegal_projects')]

# Supabase configuration
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')

# JWT Configuration
SECRET_KEY = os.environ.get('SECRET_KEY', secrets.token_hex(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI(title="Plateforme Financement Projets Citoyens - Sénégal")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== ENUMS ==============

class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICIAL = "official"
    ADMIN = "admin"

class ProjectStatus(str, Enum):
    DRAFT = "draft"
    PENDING = "pending"
    DOCUMENTS_REQUESTED = "documents_requested"
    VALIDATED = "validated"
    APPROVED = "approved"
    REJECTED = "rejected"

class NotificationType(str, Enum):
    PROJECT_SUBMITTED = "project_submitted"
    PROJECT_VALIDATED = "project_validated"
    PROJECT_APPROVED = "project_approved"
    PROJECT_REJECTED = "project_rejected"
    DOCUMENTS_REQUESTED = "documents_requested"
    NEW_COMMENT = "new_comment"
    ACCOUNT_VERIFIED = "account_verified"
    PASSWORD_RESET = "password_reset"

class DocumentType(str, Enum):
    PASSPORT = "passport"
    CNI = "cni"
    PERMIS = "permis"
    AUTRE = "autre"

class ProjectCategory(str, Enum):
    AGRICULTURE = "Agriculture"
    EDUCATION = "Éducation"
    SANTE = "Santé"
    COMMERCE = "Commerce"
    ARTISANAT = "Artisanat"
    TECHNOLOGIE = "Technologie"
    ENVIRONNEMENT = "Environnement"
    IA = "IA"
    IT = "IT"
    MODE = "Mode"
    EVENEMENTIEL = "Événementiel"
    SANTE_BIEN_ETRE = "Santé & Bien-être"
    MLM = "MLM (Marketing relationnel)"
    TRANSPORT = "Transport"
    RETAIL = "Retail"
    TOURISME = "Tourisme"
    RESTAURATION = "Restauration"
    BTP = "BTP/Construction"
    SERVICES = "Services"
    CULTURE_ARTS = "Culture & Arts"
    SPORT = "Sport"
    ENERGIE = "Énergie"
    FINANCE = "Finance/Fintech"
    IMMOBILIER = "Immobilier"
    MEDIA = "Média/Communication"
    AUTRE = "Autre"

# ============== MODELS ==============

class IdentityDocument(BaseModel):
    type: DocumentType
    number: str
    issue_date: str
    expiry_date: str
    file_url: Optional[str] = None

class Filiation(BaseModel):
    father_name: str
    mother_name: str
    birth_place: str
    birth_date: str
    nationality: str = "Sénégalaise"

class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: UserRole = UserRole.CITIZEN
    identity_document: Optional[IdentityDocument] = None
    filiation: Optional[Filiation] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    identity_document: Optional[IdentityDocument] = None
    filiation: Optional[Filiation] = None
    profile_picture: Optional[str] = None

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    role: UserRole = UserRole.CITIZEN
    is_verified: bool = False
    is_active: bool = True
    identity_document: Optional[IdentityDocument] = None
    filiation: Optional[Filiation] = None
    profile_picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    phone: str
    address: Optional[str] = None
    city: Optional[str] = None
    region: Optional[str] = None
    role: UserRole
    is_verified: bool
    is_active: bool
    identity_document: Optional[IdentityDocument] = None
    filiation: Optional[Filiation] = None
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class ProjectDocument(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    file_url: str
    file_type: str
    file_size: int
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    title: str
    description: str
    category: ProjectCategory
    funding_requested: float
    start_date: str
    duration_months: int
    objectives: List[str] = []
    budget_breakdown: Optional[Dict[str, float]] = None
    location: Optional[str] = None

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[ProjectCategory] = None
    funding_requested: Optional[float] = None
    start_date: Optional[str] = None
    duration_months: Optional[int] = None
    objectives: Optional[List[str]] = None
    budget_breakdown: Optional[Dict[str, float]] = None
    location: Optional[str] = None
    status: Optional[ProjectStatus] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    category: ProjectCategory
    funding_requested: float
    start_date: str
    duration_months: int
    objectives: List[str] = []
    budget_breakdown: Dict[str, float] = {}
    location: Optional[str] = None
    status: ProjectStatus = ProjectStatus.DRAFT
    documents: List[ProjectDocument] = []
    rejection_reason: Optional[str] = None
    documents_request_reason: Optional[str] = None
    assigned_official_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    submitted_at: Optional[datetime] = None
    validated_at: Optional[datetime] = None
    approved_at: Optional[datetime] = None

class Comment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    user_id: str
    user_name: str
    user_role: UserRole
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CommentCreate(BaseModel):
    content: str

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: NotificationType
    title: str
    message: str
    data: Dict[str, Any] = {}
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    user_id: str
    user_name: str
    action: str
    details: Optional[str] = None
    old_status: Optional[ProjectStatus] = None
    new_status: Optional[ProjectStatus] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class AdminUserUpdate(BaseModel):
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None

# ============== HELPERS ==============

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_verification_token() -> str:
    return secrets.token_urlsafe(32)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Token invalide")
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalide ou expiré")
    
    user_doc = await db.users.find_one({"id": user_id})
    if user_doc is None:
        raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
    
    return User(**user_doc)

async def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès réservé aux administrateurs")
    return current_user

async def get_official_or_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.OFFICIAL, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Accès réservé aux fonctionnaires et administrateurs")
    return current_user

def serialize_datetime(obj):
    """Serialize datetime objects for MongoDB"""
    if isinstance(obj, datetime):
        return obj.isoformat()
    elif isinstance(obj, dict):
        return {k: serialize_datetime(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_datetime(item) for item in obj]
    return obj

def deserialize_datetime(obj, fields):
    """Deserialize datetime fields from MongoDB"""
    for field in fields:
        if field in obj and isinstance(obj[field], str):
            try:
                obj[field] = datetime.fromisoformat(obj[field])
            except:
                pass
    return obj

# ============== EMAIL SERVICE (SIMULATION) ==============

async def send_email(to_email: str, subject: str, body: str):
    """Simulated email sending - logs to console"""
    logger.info(f"""
    ========== EMAIL SIMULÉ ==========
    À: {to_email}
    Sujet: {subject}
    Corps: {body}
    ==================================
    """)
    return True

async def send_verification_email(email: str, token: str):
    """Send verification email"""
    verification_link = f"https://plateforme-projets.sn/verify-email?token={token}"
    subject = "Vérifiez votre adresse email - Plateforme Projets Citoyens"
    body = f"""
    Bienvenue sur la Plateforme de Financement des Projets Citoyens du Sénégal !
    
    Cliquez sur le lien suivant pour vérifier votre adresse email:
    {verification_link}
    
    Ce lien expire dans 24 heures.
    
    Si vous n'avez pas créé de compte, ignorez cet email.
    """
    await send_email(email, subject, body)

async def send_password_reset_email(email: str, token: str):
    """Send password reset email"""
    reset_link = f"https://plateforme-projets.sn/reset-password?token={token}"
    subject = "Réinitialisation de mot de passe - Plateforme Projets Citoyens"
    body = f"""
    Vous avez demandé la réinitialisation de votre mot de passe.
    
    Cliquez sur le lien suivant pour définir un nouveau mot de passe:
    {reset_link}
    
    Ce lien expire dans 1 heure.
    
    Si vous n'avez pas fait cette demande, ignorez cet email.
    """
    await send_email(email, subject, body)

async def send_notification_email(email: str, title: str, message: str):
    """Send notification email"""
    await send_email(email, title, message)

# ============== FILE UPLOAD SERVICE ==============

async def upload_to_supabase(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload file to Supabase Storage"""
    if not SUPABASE_URL or not SUPABASE_ANON_KEY:
        # Fallback: store as base64 in MongoDB if Supabase not configured
        base64_content = base64.b64encode(file_content).decode('utf-8')
        return f"data:{content_type};base64,{base64_content}"
    
    try:
        bucket_name = "project-documents"
        file_path = f"{uuid.uuid4()}/{filename}"
        
        async with httpx.AsyncClient() as client:
            # Upload file
            response = await client.post(
                f"{SUPABASE_URL}/storage/v1/object/{bucket_name}/{file_path}",
                headers={
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "apikey": SUPABASE_ANON_KEY,
                    "Content-Type": content_type
                },
                content=file_content
            )
            
            if response.status_code in [200, 201]:
                return f"{SUPABASE_URL}/storage/v1/object/public/{bucket_name}/{file_path}"
            else:
                logger.error(f"Supabase upload failed: {response.text}")
                # Fallback to base64
                base64_content = base64.b64encode(file_content).decode('utf-8')
                return f"data:{content_type};base64,{base64_content}"
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        base64_content = base64.b64encode(file_content).decode('utf-8')
        return f"data:{content_type};base64,{base64_content}"

# ============== NOTIFICATION SERVICE ==============

async def create_notification(user_id: str, notif_type: NotificationType, title: str, message: str, data: dict = {}):
    """Create in-app notification and send email"""
    notification = Notification(
        user_id=user_id,
        type=notif_type,
        title=title,
        message=message,
        data=data
    )
    
    doc = serialize_datetime(notification.model_dump())
    await db.notifications.insert_one(doc)
    
    # Send email notification
    user = await db.users.find_one({"id": user_id})
    if user:
        await send_notification_email(user["email"], title, message)
    
    return notification

# ============== AUTH ROUTES ==============

@api_router.post("/auth/register", response_model=UserResponse)
async def register(user_data: UserCreate, background_tasks: BackgroundTasks):
    """Register a new user"""
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = user_data.model_dump()
    user_dict.pop("password")
    
    user = User(**user_dict)
    user_doc = serialize_datetime(user.model_dump())
    user_doc["password_hash"] = hashed_password
    
    # Create verification token
    verification_token = create_verification_token()
    user_doc["verification_token"] = verification_token
    user_doc["verification_token_expires"] = (datetime.now(timezone.utc) + timedelta(hours=24)).isoformat()
    
    await db.users.insert_one(user_doc)
    
    # Send verification email
    background_tasks.add_task(send_verification_email, user.email, verification_token)
    
    logger.info(f"New user registered: {user.email} with role {user.role}")
    
    return UserResponse(**user.model_dump())

@api_router.post("/auth/login", response_model=Token)
async def login(login_data: LoginRequest):
    """Login user"""
    user_doc = await db.users.find_one({"email": login_data.email})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not verify_password(login_data.password, user_doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    if not user_doc.get("is_active", True):
        raise HTTPException(status_code=401, detail="Votre compte a été désactivé")
    
    # Create access token
    access_token = create_access_token(data={"sub": user_doc["id"]})
    
    user = User(**deserialize_datetime(user_doc, ["created_at", "updated_at"]))
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse(**user.model_dump())
    )

@api_router.post("/auth/verify-email")
async def verify_email(data: VerifyEmailRequest):
    """Verify user email"""
    user_doc = await db.users.find_one({"verification_token": data.token})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Token de vérification invalide")
    
    # Check expiration
    expires = datetime.fromisoformat(user_doc.get("verification_token_expires", ""))
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token de vérification expiré")
    
    # Update user
    await db.users.update_one(
        {"id": user_doc["id"]},
        {
            "$set": {"is_verified": True},
            "$unset": {"verification_token": "", "verification_token_expires": ""}
        }
    )
    
    # Create notification
    await create_notification(
        user_doc["id"],
        NotificationType.ACCOUNT_VERIFIED,
        "Compte vérifié",
        "Votre adresse email a été vérifiée avec succès. Bienvenue sur la plateforme !"
    )
    
    return {"message": "Email vérifié avec succès"}

@api_router.post("/auth/forgot-password")
async def forgot_password(data: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    """Request password reset"""
    user_doc = await db.users.find_one({"email": data.email})
    if not user_doc:
        # Don't reveal if email exists
        return {"message": "Si cet email existe, vous recevrez un lien de réinitialisation"}
    
    # Create reset token
    reset_token = create_verification_token()
    await db.users.update_one(
        {"id": user_doc["id"]},
        {
            "$set": {
                "reset_token": reset_token,
                "reset_token_expires": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
            }
        }
    )
    
    background_tasks.add_task(send_password_reset_email, data.email, reset_token)
    
    return {"message": "Si cet email existe, vous recevrez un lien de réinitialisation"}

@api_router.post("/auth/reset-password")
async def reset_password(data: ResetPasswordRequest):
    """Reset password with token"""
    user_doc = await db.users.find_one({"reset_token": data.token})
    if not user_doc:
        raise HTTPException(status_code=400, detail="Token de réinitialisation invalide")
    
    # Check expiration
    expires = datetime.fromisoformat(user_doc.get("reset_token_expires", ""))
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token de réinitialisation expiré")
    
    # Update password
    hashed_password = get_password_hash(data.new_password)
    await db.users.update_one(
        {"id": user_doc["id"]},
        {
            "$set": {"password_hash": hashed_password},
            "$unset": {"reset_token": "", "reset_token_expires": ""}
        }
    )
    
    # Create notification
    await create_notification(
        user_doc["id"],
        NotificationType.PASSWORD_RESET,
        "Mot de passe modifié",
        "Votre mot de passe a été modifié avec succès."
    )
    
    return {"message": "Mot de passe réinitialisé avec succès"}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current user"""
    return UserResponse(**current_user.model_dump())

# ============== USER ROUTES ==============

@api_router.put("/users/me", response_model=UserResponse)
async def update_profile(update_data: UserUpdate, current_user: User = Depends(get_current_user)):
    """Update current user profile"""
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": serialize_datetime(update_dict)}
    )
    
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserResponse(**deserialize_datetime(updated_user, ["created_at", "updated_at"]))

@api_router.post("/users/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload user avatar"""
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5Mo)")
    
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Seules les images sont acceptées")
    
    content = await file.read()
    file_url = await upload_to_supabase(content, file.filename, file.content_type)
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"profile_picture": file_url, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"url": file_url}

@api_router.post("/users/upload-identity-document")
async def upload_identity_document(
    file: UploadFile = File(...),
    doc_type: DocumentType = Form(...),
    doc_number: str = Form(...),
    issue_date: str = Form(...),
    expiry_date: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    """Upload identity document"""
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5Mo)")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Format non accepté (PDF ou images uniquement)")
    
    content = await file.read()
    file_url = await upload_to_supabase(content, file.filename, file.content_type)
    
    identity_doc = IdentityDocument(
        type=doc_type,
        number=doc_number,
        issue_date=issue_date,
        expiry_date=expiry_date,
        file_url=file_url
    )
    
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {
            "identity_document": identity_doc.model_dump(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Document d'identité téléchargé", "document": identity_doc.model_dump()}

# ============== PROJECT ROUTES ==============

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: User = Depends(get_current_user)):
    """Create a new project"""
    if current_user.role not in [UserRole.CITIZEN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Seuls les citoyens peuvent créer des projets")
    
    project = Project(
        user_id=current_user.id,
        **project_data.model_dump()
    )
    
    doc = serialize_datetime(project.model_dump())
    await db.projects.insert_one(doc)
    
    # Create history entry
    history = ProjectHistory(
        project_id=project.id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action="Projet créé",
        new_status=ProjectStatus.DRAFT
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects(
    status: Optional[ProjectStatus] = None,
    category: Optional[ProjectCategory] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get projects based on user role"""
    query = {}
    
    # Filter based on role
    if current_user.role == UserRole.CITIZEN:
        query["user_id"] = current_user.id
    elif current_user.role == UserRole.OFFICIAL:
        # Officials see pending and assigned projects
        query["$or"] = [
            {"status": {"$in": [ProjectStatus.PENDING, ProjectStatus.DOCUMENTS_REQUESTED, ProjectStatus.VALIDATED]}},
            {"assigned_official_id": current_user.id}
        ]
    # Admin sees all
    
    if status:
        query["status"] = status
    if category:
        query["category"] = category
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    projects = await db.projects.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    for p in projects:
        deserialize_datetime(p, ["created_at", "updated_at", "submitted_at", "validated_at", "approved_at"])
    
    return projects

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project details"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Check access
    if current_user.role == UserRole.CITIZEN and project["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    deserialize_datetime(project, ["created_at", "updated_at", "submitted_at", "validated_at", "approved_at"])
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    update_data: ProjectUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    # Check access
    if current_user.role == UserRole.CITIZEN:
        if project["user_id"] != current_user.id:
            raise HTTPException(status_code=403, detail="Accès non autorisé")
        if project["status"] not in [ProjectStatus.DRAFT, ProjectStatus.DOCUMENTS_REQUESTED]:
            raise HTTPException(status_code=400, detail="Ce projet ne peut plus être modifié")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Track status change
    old_status = project.get("status")
    new_status = update_dict.get("status", old_status)
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": serialize_datetime(update_dict)}
    )
    
    # Create history entry if status changed
    if old_status != new_status:
        history = ProjectHistory(
            project_id=project_id,
            user_id=current_user.id,
            user_name=f"{current_user.first_name} {current_user.last_name}",
            action=f"Statut modifié: {old_status} → {new_status}",
            old_status=old_status,
            new_status=new_status
        )
        await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    updated_project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    deserialize_datetime(updated_project, ["created_at", "updated_at", "submitted_at", "validated_at", "approved_at"])
    return Project(**updated_project)

@api_router.post("/projects/{project_id}/submit")
async def submit_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Submit project for review"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if project["status"] not in [ProjectStatus.DRAFT, ProjectStatus.DOCUMENTS_REQUESTED]:
        raise HTTPException(status_code=400, detail="Ce projet ne peut pas être soumis")
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": ProjectStatus.PENDING,
            "submitted_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create history entry
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action="Projet soumis pour validation",
        old_status=project["status"],
        new_status=ProjectStatus.PENDING
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    # Notify admins/officials
    officials = await db.users.find({"role": {"$in": [UserRole.OFFICIAL, UserRole.ADMIN]}}).to_list(100)
    for official in officials:
        await create_notification(
            official["id"],
            NotificationType.PROJECT_SUBMITTED,
            "Nouveau projet soumis",
            f"Un nouveau projet '{project['title']}' a été soumis pour validation.",
            {"project_id": project_id}
        )
    
    return {"message": "Projet soumis avec succès"}

@api_router.post("/projects/{project_id}/validate")
async def validate_project(project_id: str, current_user: User = Depends(get_official_or_admin)):
    """Validate project (Official/Admin only)"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["status"] != ProjectStatus.PENDING:
        raise HTTPException(status_code=400, detail="Ce projet ne peut pas être validé")
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": ProjectStatus.VALIDATED,
            "validated_at": datetime.now(timezone.utc).isoformat(),
            "assigned_official_id": current_user.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create history
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action="Projet validé",
        old_status=ProjectStatus.PENDING,
        new_status=ProjectStatus.VALIDATED
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    # Notify project owner
    await create_notification(
        project["user_id"],
        NotificationType.PROJECT_VALIDATED,
        "Projet validé",
        f"Votre projet '{project['title']}' a été validé par un fonctionnaire.",
        {"project_id": project_id}
    )
    
    return {"message": "Projet validé"}

@api_router.post("/projects/{project_id}/approve")
async def approve_project(project_id: str, current_user: User = Depends(get_admin_user)):
    """Approve project (Admin only)"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["status"] != ProjectStatus.VALIDATED:
        raise HTTPException(status_code=400, detail="Ce projet doit d'abord être validé")
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": ProjectStatus.APPROVED,
            "approved_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create history
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action="Projet approuvé pour financement",
        old_status=ProjectStatus.VALIDATED,
        new_status=ProjectStatus.APPROVED
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    # Notify project owner
    await create_notification(
        project["user_id"],
        NotificationType.PROJECT_APPROVED,
        "Projet approuvé !",
        f"Félicitations ! Votre projet '{project['title']}' a été approuvé pour financement.",
        {"project_id": project_id}
    )
    
    return {"message": "Projet approuvé"}

@api_router.post("/projects/{project_id}/reject")
async def reject_project(
    project_id: str,
    reason: str = Form(...),
    current_user: User = Depends(get_official_or_admin)
):
    """Reject project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["status"] not in [ProjectStatus.PENDING, ProjectStatus.VALIDATED]:
        raise HTTPException(status_code=400, detail="Ce projet ne peut pas être rejeté")
    
    old_status = project["status"]
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": ProjectStatus.REJECTED,
            "rejection_reason": reason,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create history
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action=f"Projet rejeté: {reason}",
        old_status=old_status,
        new_status=ProjectStatus.REJECTED
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    # Notify project owner
    await create_notification(
        project["user_id"],
        NotificationType.PROJECT_REJECTED,
        "Projet rejeté",
        f"Votre projet '{project['title']}' a été rejeté. Raison: {reason}",
        {"project_id": project_id, "reason": reason}
    )
    
    return {"message": "Projet rejeté"}

@api_router.post("/projects/{project_id}/request-documents")
async def request_documents(
    project_id: str,
    reason: str = Form(...),
    current_user: User = Depends(get_official_or_admin)
):
    """Request additional documents"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["status"] != ProjectStatus.PENDING:
        raise HTTPException(status_code=400, detail="Documents ne peuvent être demandés qu'en attente de validation")
    
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {
            "status": ProjectStatus.DOCUMENTS_REQUESTED,
            "documents_request_reason": reason,
            "assigned_official_id": current_user.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Create history
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action=f"Documents supplémentaires demandés: {reason}",
        old_status=ProjectStatus.PENDING,
        new_status=ProjectStatus.DOCUMENTS_REQUESTED
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    # Notify project owner
    await create_notification(
        project["user_id"],
        NotificationType.DOCUMENTS_REQUESTED,
        "Documents supplémentaires requis",
        f"Des documents supplémentaires sont nécessaires pour votre projet '{project['title']}': {reason}",
        {"project_id": project_id, "reason": reason}
    )
    
    return {"message": "Demande de documents envoyée"}

@api_router.post("/projects/{project_id}/upload-document")
async def upload_project_document(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload document to project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["user_id"] != current_user.id and current_user.role not in [UserRole.OFFICIAL, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    if file.size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier trop volumineux (max 5Mo)")
    
    allowed_types = ["application/pdf", "image/jpeg", "image/png", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Format non accepté (PDF ou images uniquement)")
    
    content = await file.read()
    file_url = await upload_to_supabase(content, file.filename, file.content_type)
    
    doc = ProjectDocument(
        name=file.filename,
        file_url=file_url,
        file_type=file.content_type,
        file_size=file.size
    )
    
    await db.projects.update_one(
        {"id": project_id},
        {
            "$push": {"documents": serialize_datetime(doc.model_dump())},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    # Create history
    history = ProjectHistory(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        action=f"Document ajouté: {file.filename}"
    )
    await db.project_history.insert_one(serialize_datetime(history.model_dump()))
    
    return {"message": "Document téléchargé", "document": doc.model_dump()}

@api_router.delete("/projects/{project_id}/documents/{document_id}")
async def delete_project_document(
    project_id: str,
    document_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete document from project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if project["user_id"] != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    await db.projects.update_one(
        {"id": project_id},
        {
            "$pull": {"documents": {"id": document_id}},
            "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}
        }
    )
    
    return {"message": "Document supprimé"}

@api_router.get("/projects/{project_id}/history", response_model=List[ProjectHistory])
async def get_project_history(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project history"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if current_user.role == UserRole.CITIZEN and project["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    history = await db.project_history.find({"project_id": project_id}, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for h in history:
        deserialize_datetime(h, ["created_at"])
    
    return history

# ============== COMMENTS ROUTES ==============

@api_router.post("/projects/{project_id}/comments", response_model=Comment)
async def add_comment(
    project_id: str,
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user)
):
    """Add comment to project"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if current_user.role == UserRole.CITIZEN and project["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    comment = Comment(
        project_id=project_id,
        user_id=current_user.id,
        user_name=f"{current_user.first_name} {current_user.last_name}",
        user_role=current_user.role,
        content=comment_data.content
    )
    
    await db.comments.insert_one(serialize_datetime(comment.model_dump()))
    
    # Notify project owner or officials
    if current_user.id != project["user_id"]:
        await create_notification(
            project["user_id"],
            NotificationType.NEW_COMMENT,
            "Nouveau commentaire",
            f"Un nouveau commentaire a été ajouté à votre projet '{project['title']}'",
            {"project_id": project_id, "comment_id": comment.id}
        )
    
    return comment

@api_router.get("/projects/{project_id}/comments", response_model=List[Comment])
async def get_comments(project_id: str, current_user: User = Depends(get_current_user)):
    """Get project comments"""
    project = await db.projects.find_one({"id": project_id}, {"_id": 0})
    if not project:
        raise HTTPException(status_code=404, detail="Projet non trouvé")
    
    if current_user.role == UserRole.CITIZEN and project["user_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="Accès non autorisé")
    
    comments = await db.comments.find({"project_id": project_id}, {"_id": 0}).sort("created_at", 1).to_list(100)
    
    for c in comments:
        deserialize_datetime(c, ["created_at"])
    
    return comments

# ============== NOTIFICATIONS ROUTES ==============

@api_router.get("/notifications", response_model=List[Notification])
async def get_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Get user notifications"""
    query = {"user_id": current_user.id}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    for n in notifications:
        deserialize_datetime(n, ["created_at"])
    
    return notifications

@api_router.get("/notifications/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    """Get unread notifications count"""
    count = await db.notifications.count_documents({"user_id": current_user.id, "is_read": False})
    return {"count": count}

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: User = Depends(get_current_user)):
    """Mark notification as read"""
    result = await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user.id},
        {"$set": {"is_read": True}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Notification non trouvée")
    
    return {"message": "Notification marquée comme lue"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: User = Depends(get_current_user)):
    """Mark all notifications as read"""
    await db.notifications.update_many(
        {"user_id": current_user.id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"message": "Toutes les notifications marquées comme lues"}

# ============== ADMIN ROUTES ==============

@api_router.get("/admin/users", response_model=List[UserResponse])
async def admin_get_users(
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    current_user: User = Depends(get_admin_user)
):
    """Get all users (Admin only)"""
    query = {}
    if role:
        query["role"] = role
    if search:
        query["$or"] = [
            {"email": {"$regex": search, "$options": "i"}},
            {"first_name": {"$regex": search, "$options": "i"}},
            {"last_name": {"$regex": search, "$options": "i"}}
        ]
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    
    for u in users:
        deserialize_datetime(u, ["created_at", "updated_at"])
    
    return users

@api_router.put("/admin/users/{user_id}", response_model=UserResponse)
async def admin_update_user(
    user_id: str,
    update_data: AdminUserUpdate,
    current_user: User = Depends(get_admin_user)
):
    """Update user (Admin only)"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    await db.users.update_one(
        {"id": user_id},
        {"$set": update_dict}
    )
    
    updated_user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    deserialize_datetime(updated_user, ["created_at", "updated_at"])
    
    return UserResponse(**updated_user)

@api_router.get("/admin/stats")
async def admin_get_stats(current_user: User = Depends(get_admin_user)):
    """Get dashboard statistics (Admin only)"""
    # User stats
    total_users = await db.users.count_documents({})
    citizens = await db.users.count_documents({"role": UserRole.CITIZEN})
    officials = await db.users.count_documents({"role": UserRole.OFFICIAL})
    verified_users = await db.users.count_documents({"is_verified": True})
    
    # Project stats
    total_projects = await db.projects.count_documents({})
    projects_by_status = {}
    for status in ProjectStatus:
        count = await db.projects.count_documents({"status": status})
        projects_by_status[status.value] = count
    
    # Funding stats
    pipeline = [
        {"$match": {"status": ProjectStatus.APPROVED}},
        {"$group": {"_id": None, "total": {"$sum": "$funding_requested"}}}
    ]
    result = await db.projects.aggregate(pipeline).to_list(1)
    total_funding_approved = result[0]["total"] if result else 0
    
    pipeline = [
        {"$match": {"status": ProjectStatus.PENDING}},
        {"$group": {"_id": None, "total": {"$sum": "$funding_requested"}}}
    ]
    result = await db.projects.aggregate(pipeline).to_list(1)
    total_funding_pending = result[0]["total"] if result else 0
    
    # Projects by category
    pipeline = [
        {"$group": {"_id": "$category", "count": {"$sum": 1}}}
    ]
    category_stats = await db.projects.aggregate(pipeline).to_list(100)
    projects_by_category = {item["_id"]: item["count"] for item in category_stats}
    
    # Recent activity
    recent_projects = await db.projects.find({}, {"_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    
    return {
        "users": {
            "total": total_users,
            "citizens": citizens,
            "officials": officials,
            "verified": verified_users
        },
        "projects": {
            "total": total_projects,
            "by_status": projects_by_status,
            "by_category": projects_by_category
        },
        "funding": {
            "approved": total_funding_approved,
            "pending": total_funding_pending
        },
        "recent_projects": recent_projects
    }

@api_router.get("/admin/export/projects")
async def admin_export_projects(
    format: str = Query("json", enum=["json", "csv"]),
    current_user: User = Depends(get_admin_user)
):
    """Export projects data"""
    projects = await db.projects.find({}, {"_id": 0}).to_list(10000)
    
    if format == "csv":
        import csv
        from io import StringIO
        
        output = StringIO()
        if projects:
            writer = csv.DictWriter(output, fieldnames=projects[0].keys())
            writer.writeheader()
            for p in projects:
                # Flatten nested objects for CSV
                flat_p = {}
                for k, v in p.items():
                    if isinstance(v, (dict, list)):
                        flat_p[k] = str(v)
                    else:
                        flat_p[k] = v
                writer.writerow(flat_p)
        
        return {"data": output.getvalue(), "filename": "projects_export.csv"}
    
    return {"data": projects, "filename": "projects_export.json"}

# ============== PUBLIC ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "API Plateforme Financement Projets Citoyens - Sénégal"}

@api_router.get("/categories")
async def get_categories():
    """Get all project categories"""
    return [{"value": cat.value, "label": cat.value} for cat in ProjectCategory]

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
