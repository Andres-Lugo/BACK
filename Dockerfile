# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install system dependencies (including Python, pip, build-essential, etc.)
# Also, make python refer to python3 for convenience
RUN apt-get update && apt-get install -y \
    python3 python3-pip build-essential \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Create and activate a virtual environment for Python
RUN python -m venv /venv
RUN /venv/bin/pip install --upgrade pip

# Install Node.js dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy Python requirements and install dependencies
COPY requirements.txt ./
RUN /venv/bin/pip install -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose the necessary ports (for Node.js/Express and optionally for Python if needed)
EXPOSE 3000

# Start the Express server
CMD ["npm", "start"]
