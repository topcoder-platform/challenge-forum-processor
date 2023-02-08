FROM webdevops/php-apache

ENV VANILLA_VERSION 3.3
ENV WEB_DOCUMENT_ROOT /vanillapp
RUN wget --no-check-certificate https://github.com/vanilla/vanilla/releases/download/Vanilla_${VANILLA_VERSION}/vanilla-${VANILLA_VERSION}.zip
RUN unzip vanilla-${VANILLA_VERSION}.zip -d /tmp
RUN cp -r /tmp/package/. /vanillapp/
RUN chmod -R 777 /vanillapp
