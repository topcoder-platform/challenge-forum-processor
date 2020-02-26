FROM webdevops/php-apache

ENV VANILLA_VERSION 3.0

RUN wget https://github.com/vanilla/vanilla/releases/download/Vanilla_3.0/vanilla-${VANILLA_VERSION}.zip
RUN unzip vanilla-${VANILLA_VERSION}.zip -d /tmp
RUN cp -r /tmp/package/. /app/
RUN chmod -R 777 /app
