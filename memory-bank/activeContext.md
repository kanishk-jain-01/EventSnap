# Active Context

## Current Work Focus

The immediate goal is to implement the **AI-powered Chat Assistant** using a Retrieval-Augmented Generation (RAG) architecture.

The implementation has been broken down into several parent tasks in `tasks/tasks-prd-ai-chat-rag.md`. We have completed the document upload and vector ingestion pipelines.

## Next Steps

The next task is **3.0 Build `ragAnswer` Cloud Function for RAG responses**. This involves creating a new, HTTPS-callable Cloud Function that will:
1.  Receive a question from a user.
2.  Validate the user's event participation.
3.  Query the Pinecone vector database for relevant context from uploaded documents.
4.  Construct a prompt using this context and the user's question.
5.  Call the OpenAI GPT-4o model to generate an answer.
6.  Return the structured answer, including citations, to the client application. 