import * as React from 'react';
import Layout from './layout';

interface Props {
    message: string;
}

export default class OAuthErrorPage extends React.Component<Props, {}> {
    render() {
        return (
            <Layout
                title="Error">
                <div>
                    <div>Error occurred</div>
                    <pre>{this.props.message}</pre>
                </div>
            </Layout>
        );
    }
}