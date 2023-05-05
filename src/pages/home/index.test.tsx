import { render, screen } from "@testing-library/react";
import React from "react";
import Home from "./index";
import { mount } from 'enzyme';

describe('load fiat page', () => {
  it('Normal display Screen', () => {
    render(<Home />)
    expect(screen.getByText('Apply Now')).toBeInTheDocument();
  });

  it('click first screen', () => {
    const wrapper = mount(<Home />)
    // const spy = jest.spyOn(wrapper, "initRamp");
    // wrapper.instance().forceUpdate();
    wrapper.find(".adm-button").simulate("click");
    // expect(spy).toHaveBeenCalled();
  });
})