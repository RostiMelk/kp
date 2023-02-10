const { promisify } = require('util');
const exec = promisify(require('child_process').exec);

export async function cli(args) {
	const port = args[2];

	if (!port) {
		console.log('Please provide a port number');
		return;
	}

	try {
		const processes = await lsof();
		const process = processes.find((process) => process.NAME.includes(`:${port}`));
		if (!process) {
			console.log(`No process found listening on port ${port}`);
			return;
		}
		await killProcess(process.PID);
		console.log(`Killed process ${process.PID} listening on port ${port}`);
	} catch (error) {
		console.log(error);
	}
}

async function lsof() {
	const { stdout, stderr } = await exec('lsof -PiTCP -sTCP:LISTEN');
	if (stderr) {
		throw new Error(stderr);
	}

	const arrayOrder = ['COMMAND', 'PID', 'USER', 'FD', 'TYPE', 'DEVICE', 'SIZE/OFF', 'NODE', 'NAME'];
	return stdout
		.split('\n')
		.map((line) => {
			if (!line) return null;
			const array = line.split(/\s+/);
			const obj = {};
			arrayOrder.forEach((key, index) => {
				obj[key] = array[index];
			});
			return obj;
		})
		.filter((line) => line);
}

async function killProcess(port) {
	const { stdout, stderr } = await exec(`kill -9 ${port}`);
	if (stderr) {
		throw new Error(stderr);
	}
}
