INSERT INTO
    clients (name, client_key, client_secret, redirect_uri, description)
    VALUES ('Test Application #1', 'testApp1', 'testApp1Secret', 'http://localhost:3001/callback', 'This is the first test application');

INSERT INTO
    clients (name, client_key, client_secret, redirect_uri, description)
    VALUES ('Test Application #2', 'testApp2', 'testApp2Secret', 'http://localhost:3002/callback', 'This is the second test application');

INSERT INTO
    clients (name, client_key, client_secret, redirect_uri, description)
    VALUES ('Targetprocess Views experiments', 'temp-tpViewsExperiments', 'temp-tpViewsExperimentsSecret', 'http://tp-experiments.herokuapp.com/auth/callback', 'Experimental things with Targetprocess views');
