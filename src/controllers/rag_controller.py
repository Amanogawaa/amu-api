from fastapi import APIRouter, HTTPException
from src.services.rag_service import RAGService
from src.services.pdf_processor import read_pdfs_from_folder
from src.services.web_fetcher import fetch_url_content
from pydantic import BaseModel
import os

router = APIRouter()
rag_service = RAGService()

class QueryRequest(BaseModel):
    question: str

class UploadRequest(BaseModel):
    url: str = None

@router.post("/index-pdfs")
async def index_pdfs():
    folder_path = "./rag_data"
    if not os.path.exists(folder_path):
        raise HTTPException(status_code=400, detail="rag_data folder not found")
    documents = read_pdfs_from_folder(folder_path)
    for doc in documents:
        rag_service.index_document(
            content=doc["content"],
            metadata={"source": doc["filename"]},
            doc_id=doc["filename"]
        )
    return {"status": "PDFs indexed successfully"}

@router.post("/index-url")
async def index_url(request: UploadRequest):
    if not request.url:
        raise HTTPException(status_code=400, detail="URL is required")
    content = fetch_url_content(request.url)
    if content:
        rag_service.index_document(
            content=content,
            metadata={"source": request.url},
            doc_id=request.url
        )
        return {"status": "URL indexed successfully"}
    raise HTTPException(status_code=500, detail="Failed to fetch URL content")

@router.post("/query")
async def query(request: QueryRequest):
    response = rag_service.answer_query(request.question)
    return {"answer": response}