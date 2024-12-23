echo "开始发布"
msbuild E:\HMS\ServerApp\HMS.WebUI -p:DeployOnBuild=true -p:PublishProfile=FolderProfile
msbuild E:\HMS\ServerApp\HMS.MachLib.Web -p:DeployOnBuild=true -p:PublishProfile=FolderProfile
msbuild E:\HMS\ServerApp\HMS.RTMS.Web -p:DeployOnBuild=true -p:PublishProfile=FolderProfile
msbuild E:\HMS\ServerApp\HMS.BI.Web -p:DeployOnBuild=true -p:PublishProfile=FolderProfile
msbuild E:\HMS\ServerApp\HY.DV.Charts -p:DeployOnBuild=true -p:PublishProfile=FolderProfile

node index.js --all

pause
