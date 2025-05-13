import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Downloads from './pages/Downloads';
import DownloadForm from './components/DownloadForm';
import Alert from './components/Alert';
import './App.css';

const App = () => {
    return (
        <Router>
            <div className="App">
                <Header />
                <Alert />
                <Switch>
                    <Route path="/" exact component={Home} />
                    <Route path="/downloads" component={Downloads} />
                    <Route path="/download" component={DownloadForm} />
                </Switch>
                <Footer />
            </div>
        </Router>
    );
};

export default App;