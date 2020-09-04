/*common parameters*/
var mean_demand=5, capacity=5, simulation_period=10, initial_inventory=0;
var decouple = false;

/*manufacturing parameters*/
var man_mean_demand=mean_demand, man_capacity=capacity;

/*service parameters*/
var serv_mean_demand=mean_demand, serv_capacity=capacity;

/*common simulation variables*/
var rand = []; /*temporary random variables*/
var demand = [];
var poisson_pdf, poisson_cdf;

/*manufacturing simulation variables*/
var man_rand = []; /*temporary random variables*/
var man_demand = [];
var manufacturing_queue = [];
var inventory = [];
var man_poisson_pdf, man_poisson_cdf;

/*service simulation variables*/
var serv_rand = []; /*temporary random variables*/
var serv_demand = [];
var service_queue = [];
var serv_poisson_pdf, serv_poisson_cdf;

/*temporary manufacturing variables*/
var man_poisson_cdf = [], man_next_poisson;

/*temporary service variables*/
var serv_poisson_cdf = [], serv_next_poisson;

function init_poisson(manufacturing) {
	var i=0, lambda, k, pdf, cdf;
	if(decouple)
	if(manufacturing)
	lambda = man_mean_demand;
	else
	lambda = serv_mean_demand;
	else
	lambda = mean_demand;
	k = Math.floor(lambda);
	pdf = Math.pow(Math.E, -lambda);
	cdf = pdf;
	while(i<k) {
		i++;
		pdf = pdf * lambda / i;
		cdf += pdf;
	}
	if(decouple)
	if(manufacturing) {
		man_poisson_pdf = pdf;
		man_poisson_cdf = cdf;
	} else {
		serv_poisson_pdf = pdf;
		serv_poisson_cdf = cdf;
	}
	else {
		poisson_pdf = pdf;
		poisson_cdf = cdf;
	}
}

function init() {
	simulation_period = Math.floor(simulation_period);
	initial_inventory = Math.floor(initial_inventory);
	inventory.push(initial_inventory);
	if(decouple) {
		man_capacity = Math.floor(man_capacity);
		serv_capacity = Math.floor(serv_capacity);
		init_poisson(true);
		init_poisson(false);
	} else {
		capacity = Math.floor(capacity);
		init_poisson(false);
	}
}

function get_poisson_k(probability) {
	if(probability<0 || probability>1) return -1;
	var k, lambda, pdf, cdf, down=false;
	if(decouple)
	if(manufacturing) {
		lambda = man_mean_demand;
		pdf = man_poisson_pdf;
		cdf = man_poisson_cdf;
	} else {
		lambda = serv_mean_demand;
		pdf = serv_poisson_pdf;
		cdf = serv_poisson_cdf;
	}
	else {
		lambda = mean_demand;
		pdf = poisson_pdf;
		cdf = poisson_cdf;
	}
	k = Math.floor(lambda);
	while(probability<=cdf && k>=0) { /*go down*/
		down=true;
		cdf -= pdf;
		pdf = pdf * k / lambda;
		k--;
	}
	if(down) return k+1;
	while(probability>cdf) { /*go up*/
		k++;
		pdf = pdf * lambda / k;
		cdf += pdf;
	}
	return k;
}

function generate_rand() {
	rand = [];
	man_rand = [];
	serv_rand = [];
	var i=0;
	for(; i<simulation_period; i++)
	if(decouple)
	if(manufacturing)
	man_rand.push(Math.random());
	else
	serv_rand.push(Math.random());
	else
	rand.push(Math.random());
}

function generate_demand() {
	demand = [];
	man_demand = [];
	serv_demand = [];
	generate_rand();
	if(decouple)
	if(manufacturing)
	for(probability of man_rand)
	man_demand.push(get_poisson_k(probability, true));
	else
	for(probability of serv_rand)
	serv_demand.push(get_poisson_k(probability, false));
	else
	for(probability of rand)
	demand.push(get_poisson_k(probability, false));
}

function generate_service_q() {
	service_queue = [];
	var dem, cap, i=0;
	if(decouple) {
		dem = serv_demand;
		cap = serv_capacity;
	} else {
		dem = demand;
		cap = capacity;
	}
	if(dem[0] <= cap)
	service_queue.push(0);
	else
	service_queue.push(dem[0]-cap);
	for(d of dem) {
		if(i<=0) {
			i++;
			continue;
		}
		if(d+service_queue[i-1] <= cap)
		service_queue.push(0);
		else
		service_queue.push(d+service_queue[i-1]-cap);
		i++;
	}
}

function generate_manufacturing_q() {
	manufacturing_queue = [];
	inventory = [];
	var dem, cap, i=0;
	if(decouple) {
		dem = man_demand;
		cap = man_capacity;
	} else {
		dem = demand;
		cap = capacity;
	}
	if(dem[0] <= cap+initial_inventory) {
		manufacturing_queue.push(0);
		inventory.push(cap+initial_inventory-dem[0]);
	} else {
		manufacturing_queue.push(dem[0]-cap-initial_inventory);
		inventory.push(0);
	}
	for(d of dem) {
		if(i<=0) {
			i++;
			continue;
		}
		if(d+manufacturing_queue[i-1]-cap-inventory[i-1] <= 0) {
			manufacturing_queue.push(0);
			inventory.push(cap+inventory[i-1]-d-manufacturing_queue[i-1]);
		} else {
			manufacturing_queue.push(d+manufacturing_queue[i-1]-cap-inventory[i-1]);
			inventory.push(0);
		}
		i++;
	}
}


/*HTML functions*/

var element_keys = ["simp", "decoup", "initinv", "mdemand", "mcapacity", "sdemand", "scapacity", "sim"];
var elements = {};
var valid = [];

function param_init() {
	elements["simp"].value = simulation_period;
	elements["decoup"].checked = decouple;
	elements["initinv"].value = initial_inventory;
	if(decouple) {
		elements["mdemand"].value = man_mean_demand;
		elements["mcapacity"].value = man_capacity;
		elements["sdemand"].value = serv_mean_demand;
		elements["scapacity"].value = serv_capacity;
	} else {
		elements["mdemand"].value = mean_demand;
		elements["sdemand"].value = mean_demand;
		elements["mcapacity"].value = capacity;
		elements["scapacity"].value = capacity;
	}
	elements["sim"].disabled = false;
}

function load() {
	for(key of element_keys) elements[key] = document.getElementById(key);
	for(key of element_keys) valid.push(true);
	param_init();
}

function bad_input(key) {
	elements["sim"].disabled = true;
	valid[element_keys.indexOf(key)] = false;
	elements[key].classList.toggle("error");
}

function good_input(key) {
	valid[element_keys.indexOf(key)] = true;
	for(v of valid) if(!v) return;
	elements["sim"].disabled = false;
	elements[key].classList.toggle("error");
}

function check_whole(x, key) {
	var val=0;
	if(isNaN(x)) {
		bad_input(key);
		return false;
	}
	if(Number.isInteger(parseFloat(x))) {
		val = parseInt(x);
		if(val >= 0) {
			good_input(key);
			return true;
		}
	}
	bad_input(key);
	return false;
}

function check_natural(x, key) {
	var val=0;
	if(isNaN(x)) {
		bad_input(key);
		return false;
	}
	if(Number.isInteger(parseFloat(x))) {
		val = parseInt(x);
		if(val > 0) {
			good_input(key);
			return true;
		}
	}
	bad_input(key);
	return false;
}

function check_floatgt0(x, key) {
	if(isNaN(x)) {
		bad_input(key);
		return false;
	}
	if(parseFloat(x)>0) {
		good_input(key);
		return true;
	}
	bad_input(key);
	return false;
}

function simp(x) {
	if(check_natural(x.value, "simp")) simulation_period = parseInt(x.value);
}

function decoup(x) {
	decouple = x.checked;
}

function mdemand(x) {
	var val = 0;
	if(check_floatgt0(x.value, "mdemand")) {
		val = parseFloat(x.value);
		if(decouple)
		man_mean_demand = val;
		else {
			mean_demand = val;
			man_mean_demand = val;
			serv_mean_demand = val;
			elements["sdemand"].value = val;
			good_input("sdemand");
		}
	}
}

function mcapacity(x) {
	var val = 0;
	if(check_natural(x.value, "mcapacity")) {
		val = parseInt(x.value);
		if(decouple)
		man_capacity = val;
		else {
			capacity = val;
			man_capacity = val;
			serv_capacity = val;
			elements["scapacity"].value = val;
			good_input("scapacity");
		}
	}
}

function invent(x) {
	if(check_whole(x.value, "initinv")) initial_inventory = parseInt(x.value);
}

function sdemand(x) {
	var val = 0;
	if(check_floatgt0(x.value, "sdemand")) {
		val = parseFloat(x.value);
		if(decouple)
		serv_mean_demand = val;
		else {
			mean_demand = val;
			man_mean_demand = val;
			serv_mean_demand = val;
			elements["mdemand"].value = val;
			good_input("mdemand");
		}
	}
}

function scapacity(x) {
	var val = 0;
	if(check_natural(x.value, "scapacity")) {
		val = parseInt(x.value);
		if(decouple)
		serv_capacity = val;
		else {
			capacity = val;
			man_capacity = val;
			serv_capacity = val;
			elements["mcapacity"].value = val;
			good_input("mcapacity");
		}
	}
}

function simulate(x) {
	init();
	generate_demand();
	generate_service_q();
	generate_manufacturing_q();
}
