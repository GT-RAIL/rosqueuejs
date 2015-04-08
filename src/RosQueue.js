/**
 * @author Peter Mitrano - pdmitrano@wpi.edu
 */

var ROSQUEUE = ROSQUEUE || {
  REVISION : '0.0.1-SNAPSHOT'
};

/**
 * Communicates with rms_queue_manager node to handle users.
 * Developed to allow multiple users to visit an RMS interface to control a single robot
 * Users will be placed into a queue giving the first user control of the robot for a certain amount of time
 * When that user leaves, or their time ends, they will be kicked out and the next user gains control
 *
 * @constructor
 * @param options  - object with the following keys
 *      * ros - the ros ROSLIB.Ros connection handle
 *      * userId - the id of the user, used to distinguish users
 */
ROSQUEUE.RosQueue = function RosQueue(options){
	console.log(options);
	options = options || {};
	this.ros = options.ros;
	this.userId = options.userId;

	this.dequeuePub = new ROSLIB.Topic({
		ros: this.ros,
		name: 'rms_dequeue',
		messageType: 'std_msgs/Int32'
	});
	this.dequeuePub.advertise();

	this.enqueuePub = new ROSLIB.Topic({
		ros: this.ros,
		name: 'rms_enqueue',
		messageType: 'std_msgs/Int32'
	});
	this.enqueuePub.advertise();

	this.queueSub = new ROSLIB.Topic({
		ros: this.ros,
		name: 'rms_queue',
		messageType: 'rms_queue_manager/RMSQueue'
	});

	this.popFrontSub = new ROSLIB.Topic({
		ros: this.ros,
		name: 'rms_pop_front',
		messageType: 'std_msgs/Int32'
	});


	/**
	 * When I recieve a queue update, unform my onQueueUpdate function
	 * check if i'm active, and getting wait time and queue position
	 * @param message RMSQueue message, a list of UserStatus message, which have a user_id and wait_time property
	 */
	this.queueSub.subscribe = function (message) {
		console.log('RMSQueue' + message);
		var data = {}; //holds data about my place in the queue

		var i = message.queue.length;
		while (i--) {
			if (this.userId === message.queue[i].user_id) {
				data.position = i;
				if (i === 0) {
					data.active = true;
				}
				else {
					data.active = false;
					data.wait = message.queue[i].wait_time.secs;
				}
			}
		}

		this.onQueueUpdate(data);
	};


	/**
	 * if I receive a pop_front message with my id, deqeue
	 * @param message Int32 message, the id of the user to remove
	 */
	this.popFrontSub.subscribe = function (message) {
		var popUserId = message.data;
		if (this.userId === popUserId) {
			this.dequeue();
		}
	};
};



/**
 * publishes my id when I want to add myself
 */
ROSQUEUE.RosQueue.prototype.enqueue = function () {
	console.log('enqueue');
	this.enqueuePub.publish(new ROSLIB.Message({data: this.userId}));
};

/**
 * publishes my id when I want to remove myself
 */
ROSQUEUE.RosQueue.prototype.dequeue = function () {
	console.log('dequeue');
	this.dequeuePub.publish(new ROSLIB.Message({data: this.userId}));
};

ROSQUEUE.RosQueue.prototype.onTimeout = function() {
	console.log('onTimeout');
};

ROSQUEUE.RosQueue.prototype.onQueueUpdate = function() {
	console.log('queue update');
};