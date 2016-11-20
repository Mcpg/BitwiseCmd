import React from 'react';
import InputBox from './InputBox';
import * as results from '../result/result';
import HelpView from './HelpView';

export default class AppRoot extends React.Component {
    componentWillMount() {
        this.refresh();
        this.props.appState.onChange(() => this.refresh());
    }
    refresh() {
        console.log(this.props.appState.commandResults);
        this.setState(this.props.appState);
    }
    render() {
        var results = this.state.commandResults.map((r, i) => this.findResultComponent(r, i));
        return <div>
            <div className="header">
                <h1>Bitwise<span style={{color: "#c5c5c5"}}>Cmd</span></h1>
                <div>State: <span>{JSON.stringify(this.state)}</span></div>
                <ul className="top-links">
                    <li>
                        <a href="https://github.com/BorisLevitskiy/BitwiseCmd"><i className="icon github">&nbsp;</i><span className="link-text">Project on GitHub</span></a>
                    </li>
                    <li>
                        <a href="https://twitter.com/BitwiseCmd"><i className="icon twitter">&nbsp;</i><span className="link-text">Twitter</span></a>
                    </li>
                    <li>
                        <a href="mailto:&#098;&#105;&#116;&#119;&#105;&#115;&#101;&#099;&#109;&#100;&#064;&#103;&#109;&#097;&#105;&#108;&#046;&#099;&#111;&#109;?subject=Feedback"><i className="icon feedback">&nbsp;</i><span className="link-text">Send Feedback</span></a>
                    </li>
                </ul>
            </div>

            <div className="expressionInput-container">
                <InputBox />

                <span className="configPnl">
                    <span id="emphasizeBytes" data-cmd="em" className="indicator on" title="Emphasize Bytes">[em]</span>
                </span>
            </div>

            <div id="output">
              {results}
            </div>
        </div>;
    }

    findResultComponent(result, key) {
        if(result instanceof results.HelpResult) {
            return <HelpView key={key} />
        }

        return <span>Unknown result {typeof result}</span>
    }
}