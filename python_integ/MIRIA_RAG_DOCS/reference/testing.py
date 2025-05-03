from langchain_community.document_loaders import PyPDFDirectoryLoader

import requests
from typing import Optional
import os

DATA_PATH = 'rag_data/'


def load():
    docs_loader = PyPDFDirectoryLoader(DATA_PATH, glob='*.pdf', recursive=True)
    docs = docs_loader.load()
    print(f"Loaded {len(docs)} documents")
    for doc in docs:
        print(doc.metadata)
        print(doc.page_content[:100])  # Print the first 100 characters of the document content
    return docs_loader.load()



def fetch_url_content(url: str) -> Optional[str]:

    """
    Fetches the content of a specified URL.

    Args:
        url (str): The URL to fetch content from.

    Returns:
        Optional[str]: The content of the URL if successful, None otherwise.
    """

    jina_url = f'https://r.jina.ai/{url}'

    headers = {
        "Authorization": f"Bearer {os.getenv('JINA_API_KEY')}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.get(jina_url, headers=headers)

        if response.status_code == 200:
            print(response.text)
            return response.text
        else:
            print(f"Failed to fetch URL: {response.status_code} - {response.text}")
            return None

    except requests.RequestException as e:
        print(f"Error fetching URL: {e}")
        return None


if __name__ == "__main__":
    # url = "https://aws.amazon.com/what-is/retrieval-augmented-generation/"
    # content = fetch_url_content(url)
    load()
    


 