#!/usr/bin/env python
import pika
import uuid
from skf import settings

class SKFLabDeployment(object):

    def __init__(self):
        self.creds = pika.PlainCredentials('admin', 'admin-skf-secret')
        self.connection = pika.BlockingConnection(pika.ConnectionParameters(host=settings.RABBIT_MQ_CONN_STRING, credentials=self.creds))
        self.channel = self.connection.channel()
        result = self.channel.queue_declare(queue='', exclusive=True)
        self.callback_queue = result.method.queue

        self.channel.basic_consume(
            queue=self.callback_queue,
            on_message_callback=self.on_response,
            auto_ack=True)

    def on_response(self, ch, method, props, body):
        if self.corr_id == props.correlation_id:
            self.response = body

    def call(self, n):
        self.response = None
        self.corr_id = str(uuid.uuid4())
        self.channel.basic_publish(
            exchange='',
            routing_key='deployment_qeue',
            properties=pika.BasicProperties(
                reply_to=self.callback_queue,
                correlation_id=self.corr_id,
            ),
            body=n)
        while self.response is None:
            self.connection.process_data_events()
        return str(self.response)
    

def deploy_labs(instance_id, userid):
    log("User requested deployment of lab", "LOW", "PASS")
    result = LabItem.query.filter(LabItem.id == instance_id).first()
    rpc = SKFLabDeployment()
    body = result.image_tag + ":" + str(userid)
    response = rpc.call(body)
    print(type(response))  
    return {'message': response.encode().decode()} 

from flask import request
  from flask_restplus import Resource
  from skf.api.security import security_headers, select_userid_jwt, validate_privilege
from skf.api.labs.business import deploy_labs
  from skf.api.labs.serializers import lab_items, message
from skf.api.restplus import api
  from skf.api.kb.parsers import authorization

ns = api.namespace('interactive_labs', description = 'Operations related to the labs')

@api.expect(authorization)
@ns.route('/deployments/<int:instance_id>')
@api.response(404, 'Validation error', message)
class LabDeploy(Resource):

    #@api.marshal_with(lab_items)
@api.response(400, 'No results found', message)
    def get(self, instance_id):
"""
        Returns list of labs.
        * Privileges required: ** none **
  """
userid = select_userid_jwt(self)
validatsignInWithOAuthe_privilege(self, 'read')
result = deploy_labs(instance_id, userid)
return result, 200, security_headers()



def select_userid_jwt(self):
    """Returns the user_id from the JWT authorization token"""
    token = request.headers.get('Authorization').split()[0]
    try:
        checkClaims = jwt.decode(token, settings.JWT_SECRET, algorithms='HS256')
        #print(checkClaims)
    except jwt.exceptions.DecodeError:
        log("User JWT header could not be decoded", "HIGH", "FAIL")
        abort(403, 'JWT decode error')
    except jwt.exceptions.ExpiredSignature:
        log("User JWT header is expired", "HIGH", "FAIL")
        abort(403, 'JWT token expired')
    return checkClaims['UserId']


