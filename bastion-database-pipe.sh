#!/bin/bash
source ./loadbastionenv
aws ssm start-session --target $INSTANCE_ID --profile $PROFILE --region eu-west-1 --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["8000"], "localPortNumber":["3002"]}'