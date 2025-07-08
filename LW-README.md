### env

export JAVA_HOME=/home/liwei/.mx/jdks/labsjdk-ce-17-jvmci-23.1-b02_amd64
export PATH="/mnt/disk2/liwei/01-code/nodeprof.js/mx:$PATH"
export GRAAL_HOME=/mnt/disk2/liwei/01-code/graal/sdk/mxbuild/linux-amd64/GRAALVM_6B34DA359F_JAVA17/graalvm-6b34da359f-java17-23.0.0-dev
export NODEPROF_HOME=/mnt/disk2/liwei/01-code/nodeprof.js

### install
graal，graal.js 自动安装到 NodeProf 上一层目录中了，但是后续使用还找到了，好神奇


### dcg
```shell
$GRAAL_HOME/bin/node --jvm --experimental-options --vm.Dtruffle.class.path.append=$NODEPROF_HOME/build/nodeprof.jar --nodeprof $NODEPROF_HOME/src/ch.usi.inf.nodeprof/js/jalangi.js --analysis $NODEPROF_HOME/docs/panathon18/sample-analyses/dynCallGraph.js $NODEPROF_HOME/docs/panathon18/tests/callMeMaybe.js

or 

mx jalangi --analysis $NODEPROF_HOME/docs/panathon18/sample-analyses/dynCallGraph.js $NODEPROF_HOME/docs/panathon18/tests/callMeMaybe.js
```

