from fastapi import FastAPI
from pydantic import BaseModel
import docker

app = FastAPI()
client = docker.from_env()


class DeployRequest(BaseModel):
    app_name: str
    port: int


@app.get("/")
def home():
    return {"message": "Mini PaaS is running!"}


@app.post("/deploy")
def deploy(data: DeployRequest):
    try:
        container = client.containers.run(
            "nginx:latest",
            detach=True,
            ports={"80/tcp": data.port},
            name=data.app_name
        )

        return {
            "status": "success",
            "name": container.name,
            "port": data.port
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.get("/apps")
def list_apps():
    containers = client.containers.list()

    return [
        {
            "name": container.name,
            "status": container.status,
            "id": container.short_id
        }
        for container in containers
    ]
@app.delete("/apps/{name}")
def delete_app(name: str):
    try:
        container = client.containers.get(name)
        container.stop()
        container.remove()

        return {
            "status": "success",
            "message": f"{name} deleted successfully"
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }
