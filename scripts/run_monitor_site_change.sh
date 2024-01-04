#!/bin/bash

#!/bin/bash

BASEDIR=$(dirname "$0")

PROPERTY_FILE=$BASEDIR/config.properties

function getProperty {
  PROP_KEY=$1
  PROP_VALUE=`cat $PROPERTY_FILE | grep "$PROP_KEY" | cut -d'=' -f2`
  echo $PROP_VALUE
}

echo "# Reading property from $PROPERTY_FILE"
if [ -f "$PROPERTY_FILE" ]; then
  PROP_ENABLED=$(getProperty "enabled")
else
  PROP_ENABLED="true"
fi

echo $PROP_ENABLED

if [ "$PROP_ENABLED" == "false" ]; then
  echo "Monitoramento desabilitado"
else
  echo "Monitoramento habilitado"

  cd /home/brleite/projetos/monitor-site-changes/
  export NODE_HOME=/opt/node14
  export PATH=$PATH:$NODE_HOME/bin
  export CHROME_DEVEL_SANDBOX=/usr/local/sbin/chrome-devel-sandbox
  npm start
fi

