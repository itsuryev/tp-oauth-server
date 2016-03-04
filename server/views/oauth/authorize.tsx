import * as React from 'react';
import Layout from './layout';
import {getAssetPath} from '../utils';

interface Props {
    clientId: string;
    clientName: string;
    clientDescription: string;
    fullUserName: string;
    accountUrl: string;
    redirectUri: string;
}

export default class OauthAuthorizePage extends React.Component<Props, {}> {
    constructor(props: Props) {
        super(props);
    }

    render() {
        return (
            <Layout
                title="Confirm authorization">
                <div className="oauth-confirmation">
                    <form method="post">
                        <input type="hidden" name="client_id" value={this.props.clientId}/>
                        <input type="hidden" name="redirect_uri" value={this.props.redirectUri}/>

                        <div className="header">
                            <div className="app-block tp-block">
                                <div className="logo">
                                    <img alt="Targetprocess" src={getAssetPath('oauth-confirm/images/logo.svg')}/>
                                </div>
                                <h3>{this.props.fullUserName}</h3>
                                <p>at {this.props.accountUrl}</p>
                            </div>
                            <div className="arrow"></div>
                            <div className="app-block">
                                <div className="logo"></div>
                                <h3>{this.props.clientName}</h3>
                                <p>{this.props.clientDescription}</p>
                            </div>
                        </div>

                        <h1>Would you like to let <strong className="app-name">{this.props.clientName}</strong> to access your Targetprocess account?</h1>

                        <div className="description">
                            <div className="description-item">
                                <h3>The application will:</h3>
                                <ul className="will">
                                    <li>Have access to your data</li>
                                    <li>Do stuff</li>
                                    <li>Something else</li>
                                </ul>
                            </div>

                            <div className="description-item">
                                <h3>The application will not:</h3>
                                <ul className="wont">
                                    <li>Have access to your password</li>
                                </ul>
                            </div>
                        </div>

                        <div className="buttons-group">
                            <button type="submit" name="allow" value="yes" className="button button-primary">Authorize application</button>
                            <button type="submit" name="allow" value="no" className="button">Cancel</button>
                        </div>
                    </form>
                </div>
            </Layout>
        );
    }
}