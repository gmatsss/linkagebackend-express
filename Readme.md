# Deployment Workflow Documentation

This document provides an explanation of the GitHub Actions workflow for deploying a containerized application to Amazon ECS using Amazon ECR for container storage.

---

## Workflow Breakdown

### Trigger

The workflow is triggered on every push to the `main` branch.

### Environment Variables

- **AWS_REGION**: Specifies the AWS region where the resources are hosted (e.g., `us-east-1`).
- **ECR_REPOSITORY_URI**: Defines the Amazon ECR repository URI where Docker images are stored.

---

## Job: `build-and-deploy`

This job runs on the `ubuntu-latest` GitHub-hosted runner and handles the complete CI/CD pipeline.

### Steps Explanation

#### 1. Checkout Code

- **Action Used**: `actions/checkout@v3`
- Fetches the latest code from the repository to the runner.

#### 2. Configure AWS Credentials

- **Action Used**: `aws-actions/configure-aws-credentials@v3`
- Configures AWS credentials for the workflow using secrets stored in the repository.
- Uses `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` from GitHub secrets.

#### 3. Log in to Amazon ECR

- **Command**: Runs the `aws ecr get-login-password` command to authenticate Docker with Amazon ECR.
- Uses the AWS region and ECR repository URI to establish the connection.

#### 4. Build Docker Image

- **Command**: Builds the Docker image using the `docker build` command.
- Tags the image with the `latest` tag for easy reference.

#### 5. Push Docker Image to ECR

- **Command**: Pushes the built Docker image to the specified Amazon ECR repository.

#### 6. Register a New ECS Task Definition

- **Command**: Dynamically creates a task definition (`task-definition.json`) for the ECS service.
- Includes the following configurations:
  - **Family**: Defines the family name (`LinkageTaskDefinition`).
  - **Execution Role**: Specifies the IAM role ARN for ECS task execution.
  - **Container Definitions**:
    - Specifies container name (`express-backend`), image (`ECR_REPOSITORY_URI:latest`), memory (512 MB), CPU (256), and port mappings.
    - Defines environment variables like `CONSUMER_KEY` and `CONSUMER_SECRET` from GitHub secrets.
    - Configures logging with AWS CloudWatch.
  - **Network Mode**: Configures networking as `awsvpc`.
  - **Fargate Compatibility**: Ensures compatibility with AWS Fargate.
- Registers the new task definition using the `aws ecs register-task-definition` command.

#### 7. Update ECS Service

- **Command**: Updates the ECS service to use the new task definition.
- Retrieves the ARN of the latest task definition and applies it to the ECS service.
- Forces a new deployment to roll out the updated tasks immediately.

---

## Test Endpoints

The deployed application includes the following endpoints:

- **Root Endpoint**:

  - **URL**: [http://express-alb-531989323.us-east-1.elb.amazonaws.com/](http://express-alb-531989323.us-east-1.elb.amazonaws.com/)
  - **Description**: Responds with a greeting message.
  - **Example Response**: `"Hello from Node.js Express!"`

- **Health Check Endpoint**:
  - **URL**: [http://express-alb-531989323.us-east-1.elb.amazonaws.com/health](http://express-alb-531989323.us-east-1.elb.amazonaws.com/health)
  - **Description**: Checks the health status of the application.
  - **Example Response**: `"Healthy"`
  - **Status Code**: `200`

---

## Key Components

### Secrets Used

- **AWS_ACCESS_KEY_ID** and **AWS_SECRET_ACCESS_KEY**: Authenticate with AWS.
- **CONSUMER_KEY** and **CONSUMER_SECRET**: Environment-specific secrets for the application.

### Tools and Services

- **Amazon ECR**: Stores Docker images.
- **Amazon ECS**: Runs and manages the application.
- **AWS CloudWatch Logs**: Collects logs for monitoring and debugging.

---

## Conclusion

This workflow automates the deployment process, ensuring efficient CI/CD integration for the application hosted on AWS ECS using GitHub Actions.
