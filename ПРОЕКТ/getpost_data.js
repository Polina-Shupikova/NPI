const fs = require('fs');

function Get_Data(filepath){
	try{
		const jsonData = fs.readFileSync(filepath, 'utf8');
		const data = JSON.parse(jsonData);
		console.log("Data have got succesfully");
	} catch (error) {
		console.log("Error while GETing");
	}

}

function Post_Data(filepath, data){
	const jsonData = JSON.stringify(data);

	try{
		fs.writeFileSync(filepath, jsonData);
		console.log("POSTed succesfully");
	} catch (error) {
		console.log('Error while POSTing');
	}
}