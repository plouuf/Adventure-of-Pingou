To get the project running, please follow these steps: 
[At the bottom there's a deployed version if you don't want to go through all this]

1. Ensure that Node.js is installed by following the instructions following this link [https://nodejs.org/en/download]

2. Open the terminal and navigate to the root directory of this project [in the same directory as the package.json]. Run the following command to install all the necessary dependencies:

3. npm i 
[ignore dependencies vulnerabilities it's because it's using old npm packages]

Once the installation is complete, run the following command to start the project:

4. npm start

> Pingou's Adventure@1.0.0 start
> parcel src/index.html -p 8000

Server running at http://localhost:64058 - configured port 8000 could not be used.
⠋ Building...parcel-plugin-clean-easy: /Users/ploouf/Documents/code/Pingou's Adventure/dist has been removed.
✨  Built in 7.92s.
Watching for changes in 115 static files.

something like this should be displayed in the terminal

5. Finally, open your web browser and go to the following URL in the address bar:

http://localhost:<port_number>

Make sure to replace <port_number> with the actual port number specified in the terminal of the project. You should now be able to see the project up and running in the browser.


I also included the deployed version follow the link:
https://plouuf.github.io/Adventure-of-Pingou/
