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
	options = options || {};
	this.ros = options.ros;
	this.userId = options.userId;
	console.log(options);
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