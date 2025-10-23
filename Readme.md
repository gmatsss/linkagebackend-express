# Express Pipeline with AWS

This project demonstrates the deployment of a containerized Node.js application using GitHub Actions, Amazon ECS, and Amazon ECR, with DynamoDB integration for scalable data management.

## Overview

This CI/CD pipeline automates the deployment of a Node.js application to Amazon ECS. It utilizes Amazon ECR for container storage and integrates DynamoDB as a NoSQL database solution for managing application data.

### Why DynamoDB is Integrated

DynamoDB is chosen for its:

- **High Performance**: Provides low-latency responses for quick data retrieval.
- **Scalability**: Handles large-scale data loads with automatic scaling.
- **Serverless Architecture**: Reduces operational overhead by eliminating server management.
- **AWS Ecosystem Integration**: Seamlessly integrates with ECS, CloudWatch, and other AWS services.

### Use Case

DynamoDB is used to store structured data like user information and application metadata, ensuring high availability and durability.

---

## Deployment Workflow Breakdown

### Trigger

The workflow is triggered on every push to the `main` branch, automating the build, push, and deployment processes.

### Steps Overview

1. **Code Checkout**: Fetches the latest code from the repository.
2. **AWS Credential Configuration**: Authenticates with AWS using GitHub secrets.
3. **Docker Image Build and Push**: Builds the Docker image and pushes it to Amazon ECR.
4. **Task Definition Registration**: Dynamically creates a new ECS task definition.
5. **ECS Service Update**: Deploys the updated application to ECS.

---

## Application Endpoints

1. **Root Endpoint**  
   **URL**: `http://express-alb-531989323.us-east-1.elb.amazonaws.com/`  
   **Purpose**: Verifies the application is running by responding with a greeting message.  
   **Example Response**: `"Hello from Node.js Express!"`

2. **Health Check Endpoint**  
   **URL**: `http://express-alb-531989323.us-east-1.elb.amazonaws.com/health`  
   **Purpose**: Provides a health status check for the application.  
   **Example Response**: `"Healthy"`  
   **HTTP Status**: `200`

---

## Environment Variables

- `AWS_REGION`: Defines the AWS region for deployment.
- `ECR_REPOSITORY_URI`: Specifies the repository for storing Docker images.

### Secrets Used

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: For AWS authentication.
- `CONSUMER_KEY` and `CONSUMER_SECRET`: For application-specific configurations.

---

## DynamoDB Integration Use Cases

- **User Data**: Stores user profiles or preferences.
- **Application Metadata**: Tracks features like logging, analytics, and configuration.
- **Scalability**: Manages varying loads of data requests.

---

## Tools and Services

- **Amazon ECR**: Stores containerized Docker images.
- **Amazon ECS**: Deploys and manages containerized applications.
- **AWS DynamoDB**: Provides a scalable NoSQL database solution.
- **AWS CloudWatch Logs**: Monitors application performance and logs.
- **GitHub Actions**: Automates the CI/CD pipeline.

---

## Conclusion

This workflow simplifies the deployment process for containerized applications and integrates DynamoDB for high-performance and scalable data management. By leveraging AWS services like ECS, ECR, and DynamoDB, the application ensures reliability, scalability, and operational efficiency.
