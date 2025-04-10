FROM python:3.11-slim

WORKDIR /app

RUN pip install pipenv

COPY Pipfile Pipfile.lock ./

RUN pipenv install --deploy --system

COPY src/ src/

EXPOSE 8000 

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]