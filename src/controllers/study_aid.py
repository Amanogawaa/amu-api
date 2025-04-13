from fastapi import APIRouter, HTTPException
from src.services.rag_service import RAGService
from src.services.study_aid_generator import StudyAidGenerator
from pydantic import BaseModel

router = APIRouter()
rag_service = RAGService()
generator = StudyAidGenerator()

class StudyAidRequest(BaseModel):
    question: str

@router.post("/summary")
async def generate_summary(request: StudyAidRequest):
    results = rag_service.search(request.question)
    context = rag_service.format_docs(results)
    if not context:
        raise HTTPException(status_code=404, detail="No relevant content found")
    summary = generator.generate_summary(context, request.question)
    return {"summary": summary}

@router.post("/quiz")
async def generate_quiz(request: StudyAidRequest):
    results = rag_service.search(request.question)
    context = rag_service.format_docs(results)
    if not context:
        raise HTTPException(status_code=404, detail="No relevant content found")
    quiz = generator.generate_quiz(context)
    return {"quiz": quiz}

@router.post("/flashcards")
async def generate_flashcards(request: StudyAidRequest):
    results = rag_service.search(request.question)
    context = rag_service.format_docs(results)
    if not context:
        raise HTTPException(status_code=404, detail="No relevant content found")
    flashcards = generator.generate_flashcards(context)
    return {"flashcards": flashcards}