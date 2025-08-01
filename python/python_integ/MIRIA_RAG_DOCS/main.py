import os
import chromadb
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from llama_index.core import SimpleDirectoryReader, VectorStoreIndex, StorageContext
from llama_index.vector_stores.chroma import ChromaVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.llms.groq import Groq
from llama_index.core.ingestion import IngestionPipeline
from llama_index.core.node_parser import SentenceSplitter
from llama_index.core.extractors import TitleExtractor, QuestionsAnsweredExtractor
from pathlib import Path
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="RAG Service with LlamaIndex")

# Ensure data directory exists
DATA_DIR = Path("./data")
DATA_DIR.mkdir(exist_ok=True)

# Initialize Chroma client
CHROMA_DB_PATH = "./chroma_db"
db = chromadb.PersistentClient(path=CHROMA_DB_PATH)
chroma_collection = db.get_or_create_collection("healthGPT")
vector_store = ChromaVectorStore(chroma_collection=chroma_collection)

# Initialize embedding model
hf_embeddings = HuggingFaceEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Initialize Groq LLM
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set")
llm = Groq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY)

# Set up ingestion pipeline
text_splitter = SentenceSplitter(separator=" ", chunk_size=1024, chunk_overlap=128)
title_extractor = TitleExtractor(llm=llm, nodes=5)
qa_extractor = QuestionsAnsweredExtractor(llm=llm, questions=3)

pipeline = IngestionPipeline(
    transformations=[
        text_splitter,
        title_extractor,
        qa_extractor
    ]
)

# Initialize index (load existing or create new)
storage_context = StorageContext.from_defaults(vector_store=vector_store)
index = VectorStoreIndex.from_vector_store(
    vector_store=vector_store, embed_model=hf_embeddings
)
query_engine = index.as_query_engine(llm=llm)

class QueryRequest(BaseModel):
    query: str

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    try:
        # Save uploaded file to data directory
        file_path = DATA_DIR / file.filename
        with file_path.open("wb") as f:
            f.write(await file.read())
        
        # Load and process documents
        docs = SimpleDirectoryReader(input_dir=DATA_DIR).load_data()
        
        # Apply metadata transformations
        for doc in docs:
            doc.text_template = "Metadata:\n{metadata_str}\n---\nContent:\n{content}"
            if "page_label" not in doc.excluded_embed_metadata_keys:
                doc.excluded_embed_metadata_keys.append("page_label")
        
        # Run ingestion pipeline
        nodes = await pipeline.arun(documents=docs, in_place=True, show_progress=True)
        
        # Insert nodes into index
        for node in nodes:
            index.insert_nodes([node])
        
        logger.info(f"Successfully indexed document: {file.filename}")
        return {"message": f"Document {file.filename} uploaded and indexed successfully"}
    
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

@app.post("/query")
async def query_rag(request: QueryRequest):
    try:
        response = query_engine.query(request.query)
        logger.info(f"Query processed: {request.query}")
        return {"query": request.query, "response": str(response)}
    
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing query: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)