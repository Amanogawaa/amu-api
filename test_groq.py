from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

# Initialize ChatGroq
llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model="llama3-8b-8192",
    temperature=0.0
)

# Create a simple prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful assistant."),
    ("human", "Say hello in Bulgarian.")
])

# Invoke the chain
chain = prompt | llm
response = chain.invoke({})
print(response.content)