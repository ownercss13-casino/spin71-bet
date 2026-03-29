# Deployment Instructions

This document provides detailed instructions for deploying the Spin71-Bet application using Vercel, Heroku, and Docker.

## Deployment on Vercel

1. **Create a Vercel Account**: Go to [Vercel](https://vercel.com/) and sign up if you don't have an account.

2. **Import Your Project**: Click on the "New Project" button and select your GitHub repository.

3. **Configure the Settings**: 
   - Environment Variables: Add any necessary environment variables in the Vercel settings.
   - Build Settings: Choose the framework preset (if applicable).

4. **Deploy**: Click on the "Deploy" button. Vercel will build and deploy your application.

5. **Access Your Application**: Once the deployment is complete, you will receive a URL where your application is hosted.

## Deployment on Heroku

1. **Create a Heroku Account**: Go to [Heroku](https://www.heroku.com/) and create an account or login if you already have one.

2. **Install the Heroku CLI**: Download and install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli).

3. **Login to Heroku**: Run the following command in your terminal:
   ```bash
   heroku login
   ```

4. **Create a New Heroku App**: Run the following command:
   ```bash
   heroku create your-app-name
   ```

5. **Add Environment Variables**: Use the Heroku dashboard or CLI to add any necessary environment variables.

6. **Deploy Your Application**: Push your code to Heroku using Git:
   ```bash
   git push heroku main
   ```

7. **Open Your Application**: After the deployment, run:
   ```bash
   heroku open
   ```

## Deployment with Docker

1. **Install Docker**: Make sure you have [Docker](https://www.docker.com/get-started) installed on your machine.

2. **Create a Dockerfile**: In your project root, create a `Dockerfile` with the following content:
   ```dockerfile
   FROM node:14
   WORKDIR /app
   COPY package*.json ./
   RUN npm install
   COPY . .
   CMD [ "npm", "start" ]
   ```

3. **Build the Docker Image**:
   ```bash
   docker build -t your-image-name .
   ```

4. **Run the Docker Container**:
   ```bash
   docker run -p 3000:3000 your-image-name
   ```

5. **Access Your Application**: Open your browser and go to `http://localhost:3000` to view your application.

---

These instructions should help you deploy the Spin71-Bet application successfully on Vercel, Heroku, and Docker. If you encounter any issues, refer to the respective documentation of these services for troubleshooting.