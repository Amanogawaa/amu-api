from typing import Annotated
from fastapi import APIRouter, Depends, Request
from src.schema.agent_schema import *
from fastapi.responses import ORJSONResponse
from src.services.rag_service import agent

router = APIRouter(
    prefix='/api/v1/chat',
    tags=['Rag Pipeline'], 
    default_response_class=ORJSONResponse,
)

@router.post('/chat')
async def chat(input: UserInput ):
    response = await agent.achat(
        input.prompt
    )
    response = str(response)

    return ApiOutput(response=response)


