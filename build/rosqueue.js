/**
 * @author Peter Mitrano - pdmitrano@wpi.edu
 */

var ROSQUEUE = ROSQUEUE || {
  REVISION : '0.0.1-SNAPSHOT'
};
/**
 * @author Peter Mitrano - pdmitrano@wpi.edu
 */

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
ROSQUEUE.Queue = function(options){
	options = options || {};
	
	/** roslib object used by all the publishers and subscribers*/
	this.ros = options.ros;

	
	/** time in minutes that the study is conducted for*/
	this.studyTime = options.studyTime;

	/** user Id, which is used to uniquely identify all users*/
	this.userId = options.userId;

	var that = this;

	/** the publisher for dequeing */
	this.updateQueueClient = new ROSLIB.Service({
		ros: this.ros,
		name: '/update_queue',
		serviceType: 'rms_queue_manager/UpdateQueue'
	});

	/** the subscriber for the queue published by the rms_queue_manager*/
	this.queueSub = new ROSLIB.Topic({
		ros: this.ros,
		name: '/rms_queue',
		messageType: 'rms_queue_manager/RMSQueue'
	});

	/** the subscriber for the popFront (remove first user) published by the rms_queue_manager*/
	this.popFrontSub = new ROSLIB.Topic({
		ros: this.ros,
		name: '/rms_pop_front',
		messageType: 'std_msgs/Int32'
	});

	/**
	 * extracts user information and emits queue_sub event to allow interface to update
	 */
	this.queueSub.subscribe(function(message) {
		var i = message.queue.length;
		var data = {min:0,sec:0,active:false};

		while (i--) {
			if (that.userId === message.queue[i]['user_id']) {
				data.min =  Math.floor(message.queue[i]['wait_time'].secs / 60);
				data.sec = message.queue[i]['wait_time'].secs % 60;
				if (data.min === 0 && data.sec === 0){
					data.active = true;
				}
				that.emit('queue_sub',data);
			}
		}
	});

	/**
	 * extracts user information and emits pop_front_sub event to allow interface to update
	 */
	this.popFrontSub.subscribe(function(message) {
		console.log(message);
		if (that.userId === message.data) {
			that.dequeue();
			that.emit('pop_front_sub');
		}
	});
};

/**
 * publishes my id when I want to add myself
 */
ROSQUEUE.Queue.prototype.enqueue = function () {
	var studyTime = this.studyTime * 60;
	var request = new ROSLIB.ServiceRequest({
		user_id : this.userId,
		enqueue : true,
		study_time : studyTime //the rms_queue_manager node needs seconds
	});
	var that = this;
	console.log(request);
	this.updateQueueClient.callService(request,function(result){
		console.log('enqueue result...');
		that.emit('enqueue');
	});
};

/**
 * publishes my id when I want to remove myself
 */
ROSQUEUE.Queue.prototype.dequeue = function () {
	var request = new ROSLIB.ServiceRequest({
		user_id : this.userId,
		enqueue : false,
		study_time : 0
	});
	var that = this;
	this.updateQueueClient.callService(request,function(result){
		that.emit('dequeue');
	});
};

ROSQUEUE.Queue.prototype.__proto__ = EventEmitter2.prototype;