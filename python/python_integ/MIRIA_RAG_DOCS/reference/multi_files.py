import streamlit as st
from dotenv import load_dotenv
from pypdf import PdfReader
from langchain_text_splitters import CharacterTextSplitter
from langchain_huggingface.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.memory import ConversationBufferMemory

def get_pdf_text(pdf_docs):
    text = ''

    for pdf in pdf_docs:
        pdf_reader = PdfReader(pdf)
        for page in pdf_reader.pages:
            text += page.extract_text()

    return text

def get_text_chunks(raw_text):
    text_splitter = CharacterTextSplitter(
        separator="\n",
        chunk_size=1000,
        chunk_overlap=200,
        length_function=len
    )
    
    chunk = text_splitter.split_text(raw_text)

    return chunk

def create_vector_store(text_chunks):
    # embeddings =  SentenceTransformer("hkunlp/instructor-xl")
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.from_texts(texts=text_chunks, embedding=embeddings)
    print(vector_store)
    return vector_store


def main():
    load_dotenv()
    
    # st.set_page_config(page_title="Multi File Upload", page_icon=":guardsman:", layout="wide")
    # st.header("Multi File Upload Example")
 
    # st.text_input("Ask a question about the files you upload here:")

    # with st.sidebar:
    #     st.subheader("Upload Files")

    #     pdf_docs = st.file_uploader("Upload your files here", type=['pdf', 'docx', 'txt'], accept_multiple_files=True)
    #     if st.button('Process'):
    #         with st.spinner("Processing..."):
    #             raw_text = get_pdf_text(pdf_docs)

    #             # st.write(raw_text)

    #             text_chunks = get_text_chunks(raw_text)
    #             st.write(text_chunks)

    #             create_vector_store(text_chunks)


         
if __name__ == '__main__':
    main()