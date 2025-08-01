from pydantic import BaseModel

class UserInput(BaseModel):
    prompt: str

class ApiOutput(BaseModel):
    response: str
