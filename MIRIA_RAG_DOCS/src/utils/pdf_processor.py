import os
import PyPDF2
from tqdm import tqdm

def read_pdfs_from_folder(folder_path: str) -> list[dict]:
    pdf_list = []
    for filename in tqdm(os.listdir(folder_path)):
        if filename.endswith('.pdf'):
            file_path = os.path.join(folder_path, filename)
            try:
                with open(file_path, 'rb') as file:
                    reader = PyPDF2.PdfReader(file)
                    content = ""
                    for page in reader.pages:
                        text = page.extract_text() or ""
                        content += text
                    pdf_list.append({"content": content, "filename": filename})
            except Exception as e:
                print(f"Error processing {filename}: {e}")
    return pdf_list