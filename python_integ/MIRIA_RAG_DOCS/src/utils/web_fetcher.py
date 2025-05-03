import requests
from typing import Optional
import os



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
            return response.text
        else:
            print(f"Failed to fetch URL: {response.status_code} - {response.text}")
            return None

    except requests.RequestException as e:
        print(f"Error fetching URL: {e}")
        return None