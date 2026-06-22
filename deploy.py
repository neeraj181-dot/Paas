import docker

client = docker.from_env()

print("Starting Nginx...")

container = client.containers.run(
    "nginx:latest",
    detach=True,
    ports={"80/tcp": 8080},
    name="test-nginx"
)

print("Container started!")
print("Container name:", container.name)
