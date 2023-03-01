FROM gitpod/workspace-full:latest

ENV SHELL=/usr/bin/bash

# Install custom tools, runtime, etc. using apt-get
# For example, the command below would install "bastet" - a command line tetris clone:
#
# RUN sudo apt-get -q update && #     sudo apt-get install -yq bastet && #     sudo rm -rf /var/lib/apt/lists/*
#
# More information: https://www.gitpod.io/docs/config-docker/

RUN curl -fsSL https://deno.land/x/install/install.sh | sh
RUN /home/gitpod/.deno/bin/deno completions bash > /home/gitpod/.bashrc.d/90-deno && \
    echo 'export DENO_INSTALL="/home/gitpod/.deno"' >> /home/gitpod/.bashrc.d/90-deno && \
    echo 'export PATH="$DENO_INSTALL/bin:$PATH"' >> /home/gitpod/.bashrc.d/90-deno

RUN curl -fsSL https://bun.sh/install | bash
RUN echo 'export BUN_INSTALL="/home/gitpod/.bun"' >> /home/gitpod/.bashrc.d/600-bun | bash && \
    echo 'export PATH="$BUN_INSTALL/bin:$PATH"' >> /home/gitpod/.bashrc.d/600-bun | bash

RUN brew install kind
RUN brew install kubectl
RUN brew install minikube
RUN brew install helm
RUN brew install yq

RUN bash -c 'VERSION="19" \
    && source $HOME/.nvm/nvm.sh && nvm install $VERSION \
    && nvm use $VERSION && nvm alias default $VERSION'

RUN echo "nvm use default &>/dev/null" >> ~/.bashrc.d/51-nvm-fi

RUN sudo mkdir /dev/mapper