#!/bin/bash
aws ssm start-session --target $INSTANCE_ID --profile $PROFILE --region eu-west-1 --document-name AWS-StartPortForwardingSession --parameters '{"portNumber":["5432"], "localPortNumber":["5432"]}'
