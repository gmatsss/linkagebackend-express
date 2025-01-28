# Express ECR ECS CICD

This document provides an overview of the deployment process for a containerized application using GitHub Actions, Amazon ECS, and Amazon ECR. It also explains the integration of DynamoDB into the application for data management.

## Overview

This workflow ensures seamless deployment of a containerized Node.js application to Amazon ECS using GitHub Actions. It leverages Amazon ECR for container storage and integrates DynamoDB for a scalable and reliable NoSQL database solution.

## Why DynamoDB is Integrated

DynamoDB is integrated into this application to manage data in a scalable and serverless way. The key reasons for using DynamoDB are:

- **High Performance**: DynamoDB provides low-latency responses, making it suitable for applications requiring quick data retrieval.
- **Scalability**: It can handle large-scale data loads with automatic scaling.
- **Serverless Architecture**: Eliminates the need for server management, reducing operational overhead.
- **Integration with AWS Ecosystem**: Seamlessly integrates with ECS, CloudWatch, and other AWS services for monitoring and logging.

### Use Case

The application uses DynamoDB to store structured data, such as user information or application metadata, ensuring high availability and durability.

## Deployment Workflow Breakdown

### Trigger

The workflow is triggered on every push to the main branch, automating the build, push, and deployment processes.

### Steps Overview

1. **Code Checkout**: Fetches the latest code from the repository.
2. **AWS Credential Configuration**: Authenticates with AWS using GitHub secrets.
3. **Docker Image Build and Push**: Builds the Docker image and pushes it to Amazon ECR.
4. **Task Definition Registration**: Dynamically creates a new ECS task definition.
5. **ECS Service Update**: Deploys the updated application to ECS.

## Application Endpoints

### 1. Root Endpoint

- **URL**: `[BASE_URL]/`
- **Purpose**: Verifies that the application is running by responding with a greeting message.
- **Example Response**: "Hello from Node.js Express!"

### 2. Health Check Endpoint

- **URL**: `[BASE_URL]/health`
- **Purpose**: Provides a health status check for the application.
- **Example Response**: "Healthy"
- **HTTP Status**: 200

## Key Features of the Workflow

### Environment Variables

- `AWS_REGION`: Defines the AWS region for deployment.
- `ECR_REPOSITORY_URI`: Specifies the repository for storing Docker images.

### Secrets Used

- `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`: For authentication with AWS services.
- `CONSUMER_KEY` and `CONSUMER_SECRET`: For application-specific configurations.

## DynamoDB Integration Use Case

The integration of DynamoDB supports the application by enabling efficient storage and retrieval of structured data. For example, it is used to:

- **Store User Data**: Such as user profiles or preferences.
- **Track Application Metadata**: For features like logging, analytics, or configuration.
- **Enable Scalability**: Handle varying loads of data requests as the application scales.

## Tools and Services

- **Amazon ECR**: Stores containerized Docker images.
- **Amazon ECS**: Deploys and manages containerized applications.
- **AWS DynamoDB**: Provides a NoSQL database solution.
- **AWS CloudWatch Logs**: Monitors application performance and logs.
- **GitHub Actions**: Automates the CI/CD pipeline.

## Conclusion

This workflow streamlines the deployment process for containerized applications and leverages DynamoDB for high-performance, scalable data management. By integrating AWS services like ECS, ECR, and DynamoDB, the application ensures reliability, scalability, and efficient operations.
