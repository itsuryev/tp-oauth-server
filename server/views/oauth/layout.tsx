import * as React from 'react';
import {getAssetPath} from '../utils';

interface Props {
    title: string;
    children?: React.ReactNode;
}

export default class OAuthLayout extends React.Component<Props, {}> {
    render() {
        return (
            <html>
                <head>
                    <title>{this.props.title}</title>
                    <script type="text/javascript" src={getAssetPath('oauth-confirm/bundle.js')}></script>
                </head>
                <body>
                    {this.props.children}
                </body>
            </html>
        );
    }
}