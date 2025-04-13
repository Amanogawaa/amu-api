import chromadb
from langchain.text_splitter import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from langchain_groq import ChatGroq
from langchain.prompts import PromptTemplate
from duckduckgo_search import DDGS
from src.services.web_fetcher import fetch_url_content
import re
from typing import List, Dict, Optional
import os

class RAGService:
    def __init__(self):
        self.client = chromadb.PersistentClient(path="./chroma_db")
        self.collection_name = "amu_rag_index"
        self.encoder = SentenceTransformer("all-MiniLM-L6-v2")
        self.text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            model_name="gpt-4", chunk_size=150, chunk_overlap=0
        )
        self.llm = ChatGroq(
            api_key=os.getenv("GROQ_API_KEY"),
            model="llama-3.3-70b-versatile",
            temperature=2,
            max_tokens=3120,
        )
        try:
            self.collection = self.client.get_collection(self.collection_name)
        except:
            self.collection = self.client.create_collection(self.collection_name)
        
        self.decision_prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""Your job is to decide if the given question can be answered with the provided context.
            If the context can answer the question, return 1.
            If not, return 0.
            Do not return anything else.

            Context: {context}
            Question: {question}
            Answer:"""
        )
        self.answer_prompt = PromptTemplate(
            input_variables=["context", "question"],
            template="""You are an expert for answering questions. Answer the question according only to the given context.
            If the question cannot be answered using the context, say "I don't know". Do not make stuff up.
            Your answer MUST be informative, concise, and in Markdown format.

            Context: {context}
            Question: {question}
            Answer:"""
        )

    def clean_text(self, text: str) -> str:
        text = text.replace('\n', ' ').replace('\r', ' ')
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def split_text(self, text: str) -> List[str]:
        return self.text_splitter.split_text(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return self.encoder.encode(texts, convert_to_tensor=False).tolist()

    def index_document(self, content: str, metadata: Dict, doc_id: str):
        clean_content = self.clean_text(content)
        chunks = self.split_text(clean_content)
        embeddings = self.get_embeddings(chunks)
        ids = [f"{doc_id}_{i}" for i in range(len(chunks))]
        metadatas = [{"source": metadata.get("source", "unknown"), "chunk": i} for i in range(len(chunks))]
        self.collection.upsert(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def search(self, query: str, top_k: int = 3) -> List[Dict]:
        query_embedding = self.get_embeddings([query])[0]
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas"]
        )
        return [
            {"content": doc, "metadata": meta}
            for doc, meta in zip(results["documents"][0], results["metadatas"][0])
        ]

    def format_docs(self, docs: List[Dict]) -> str:
        return "\n\n".join(doc["content"] for doc in docs)

    def check_context_relevance(self, context: str, question: str) -> bool:
        response = self.llm.invoke(self.decision_prompt.format(context=context, question=question))
        return response.content.strip() == "1"

    def search_online(self, query: str) -> str:
        try:
            results = DDGS().text(query, max_results=5)
            context = ""
            for result in results:
                if result.get("href"):
                    content = fetch_url_content(result["href"])  # Uses Jina AI
                    if content:
                        context += self.clean_text(content) + "\n\n"
            return context
        except Exception as e:
            print(f"Online search failed: {e}")
            return ""

    def answer_query(self, question: str) -> str:
        results = self.search(question)
        context = self.format_docs(results)

        if self.check_context_relevance(context, question):
            response = self.llm.invoke(self.answer_prompt.format(context=context, question=question))
            return response.content
        else:
            online_context = self.search_online(question)
            if online_context:
                response = self.llm.invoke(self.answer_prompt.format(context=online_context, question=question))
                return response.content
            else:
                return "I don't know"